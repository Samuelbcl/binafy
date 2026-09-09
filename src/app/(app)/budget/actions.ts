'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  categoriser,
  detecterTransfertsMiroir,
  type RegleCategorisation,
} from '@/lib/banking/categorisation';
import {
  analyserCSV,
  dedupliquer,
  empreinteTransaction,
  type MappageColonnes,
} from '@/lib/banking/csv';
import { supabaseServeur, utilisateurCourant } from '@/lib/db/serveur';

/**
 * Import d'un extrait bancaire (doc 02 § module 3).
 *
 * Tout se passe côté serveur : le fichier n'est jamais stocké, seules les
 * transactions extraites entrent en base. Un extrait bancaire est la donnée la
 * plus sensible qu'on manipule, on n'en garde pas une copie brute.
 */

/** 5 Mo : très au-delà d'un extrait annuel, et assez bas pour ne pas servir de dépôt. */
const TAILLE_MAX = 5 * 1024 * 1024;

export type ApercuImport = {
  entetes: string[];
  separateur: string;
  /** Les premières lignes, pour que l'utilisateur vérifie avant de valider. */
  apercu: {
    date: string;
    libelle: string;
    montantCents: number;
    categorie: string | null;
  }[];
  total: number;
  rejets: { ligne: number; raison: string }[];
  mappage: Partial<MappageColonnes>;
  /** Le contenu, renvoyé au client pour l'étape de validation. */
  contenu: string;
};

export type ResultatImport =
  | { ok: true; importees: number; ignorees: number; rejetees: number; transferts?: number }
  | { ok: false; message: string };

const schemaMappage = z.object({
  date: z.string().min(1),
  libelle: z.string().min(1),
  montant: z.string().optional(),
  debit: z.string().optional(),
  credit: z.string().optional(),
  contrepartie: z.string().optional(),
  reference: z.string().optional(),
});

async function chargerReglesUtilisateur(
  supabase: Awaited<ReturnType<typeof supabaseServeur>>,
): Promise<RegleCategorisation[]> {
  const { data } = await supabase
    .from('categorisation_rules')
    .select('motif, priorite, categories(cle)')
    .order('priorite');

  return (data ?? [])
    .map((r) => {
      const cle = (r.categories as { cle: string | null } | null)?.cle;
      return cle ? { motif: r.motif, categorie: cle, priorite: r.priorite } : null;
    })
    .filter((r): r is RegleCategorisation => r !== null);
}

/** Première étape : analyser le fichier et proposer un aperçu, sans rien écrire. */
export async function analyserFichier(
  _precedent: unknown,
  donnees: FormData,
): Promise<ApercuImport | { erreur: string }> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return { erreur: 'Session expirée. Reconnecte-toi.' };

  const fichier = donnees.get('fichier');
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { erreur: 'Choisis un fichier CSV.' };
  }
  if (fichier.size > TAILLE_MAX) {
    return { erreur: 'Fichier trop volumineux (5 Mo maximum).' };
  }

  const contenu = await fichier.text();
  const analyse = analyserCSV(contenu);

  if (analyse.transactions.length === 0) {
    const raison = analyse.rejets[0]?.raison;
    return {
      erreur: raison
        ? `Aucune transaction lisible — première ligne rejetée : ${raison}. Vérifie les colonnes.`
        : 'Aucune transaction trouvée dans ce fichier.',
    };
  }

  const supabase = await supabaseServeur();
  const regles = await chargerReglesUtilisateur(supabase);

  return {
    entetes: analyse.entetes,
    separateur: analyse.separateur,
    total: analyse.transactions.length,
    rejets: analyse.rejets.slice(0, 20),
    mappage: {},
    contenu,
    apercu: analyse.transactions.slice(0, 12).map((t) => ({
      date: t.date,
      libelle: t.libelle,
      montantCents: t.montantCents,
      categorie: categoriser(t, regles).categorie,
    })),
  };
}

/** Deuxième étape : écrire réellement les transactions. */
export async function importerTransactions(
  _precedent: unknown,
  donnees: FormData,
): Promise<ResultatImport> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return { ok: false, message: 'Session expirée. Reconnecte-toi.' };

  const contenu = donnees.get('contenu');
  const nomFichier = String(donnees.get('nomFichier') ?? 'import.csv').slice(0, 200);

  if (typeof contenu !== 'string' || contenu.length === 0) {
    return { ok: false, message: 'Contenu manquant. Recommence l’import.' };
  }
  if (contenu.length > TAILLE_MAX) {
    return { ok: false, message: 'Fichier trop volumineux.' };
  }

  // Le mappage corrigé par l'utilisateur, s'il en a fourni un.
  let mappage: Partial<MappageColonnes> | undefined;
  const mappageBrut = donnees.get('mappage');
  if (typeof mappageBrut === 'string' && mappageBrut !== '') {
    try {
      const parse = schemaMappage.partial().safeParse(JSON.parse(mappageBrut));
      if (parse.success) mappage = parse.data;
    } catch {
      // Un mappage illisible n'est pas bloquant : on retombe sur la détection.
    }
  }

  const analyse = analyserCSV(contenu, mappage);
  if (analyse.transactions.length === 0) {
    return { ok: false, message: 'Aucune transaction lisible dans ce fichier.' };
  }

  const supabase = await supabaseServeur();
  const regles = await chargerReglesUtilisateur(supabase);

  // Les catégories système, pour convertir une clé en identifiant.
  const { data: categories } = await supabase
    .from('categories')
    .select('id, cle')
    .is('user_id', null);

  const idParCle = new Map(
    (categories ?? []).filter((c) => c.cle).map((c) => [c.cle as string, c.id]),
  );

  // Un seul compte pour l'instant : l'empreinte se calcule par utilisateur.
  const identifiantCompte = utilisateur.id;
  const { uniques, doublons } = dedupliquer(analyse.transactions, identifiantCompte);

  const { data: importCree, error: erreurImport } = await supabase
    .from('imports')
    .insert({
      user_id: utilisateur.id,
      nom_fichier: nomFichier,
      source: 'csv',
      lignes_importees: 0,
      lignes_ignorees: doublons,
      lignes_rejetees: analyse.rejets.length,
    })
    .select('id')
    .single();

  if (erreurImport || !importCree) {
    return { ok: false, message: `Import impossible : ${erreurImport?.message ?? 'inconnu'}` };
  }

  const lignes = uniques.map((t) => {
    const categorie = categoriser(t, regles).categorie;
    return {
      user_id: utilisateur.id,
      import_id: importCree.id,
      date: t.date,
      montant_cents: t.montantCents,
      libelle: t.libelle.slice(0, 300),
      contrepartie: t.contrepartie?.slice(0, 200) ?? null,
      reference_externe: t.referenceExterne?.slice(0, 200) ?? null,
      empreinte: empreinteTransaction(t, identifiantCompte),
      category_id: categorie ? (idParCle.get(categorie) ?? null) : null,
      source: 'csv' as const,
      // Un transfert interne n'est ni un revenu ni une dépense : il fausserait
      // le taux d'épargne s'il entrait dans le calcul.
      exclue_du_budget: categorie === 'transfert',
    };
  });

  // `ignoreDuplicates` s'appuie sur l'index unique (user_id, empreinte) : une
  // ligne déjà importée lors d'un passage précédent est écartée en base, pas
  // seulement à l'intérieur du fichier.
  const { data: inserees, error: erreurInsertion } = await supabase
    .from('transactions')
    .upsert(lignes, { onConflict: 'user_id,empreinte', ignoreDuplicates: true })
    .select('id');

  if (erreurInsertion) {
    await supabase.from('imports').delete().eq('id', importCree.id);
    return { ok: false, message: `Enregistrement impossible : ${erreurInsertion.message}` };
  }

  const importees = inserees?.length ?? 0;
  const ignorees = doublons + (uniques.length - importees);

  // Les virements entre ses propres comptes : leur reflet est peut-être dans
  // un import précédent (le compte d'épargne importé la semaine dernière).
  // On regarde donc tout l'historique, pas seulement ce fichier.
  const transferts = await marquerTransfertsMiroir(supabase, utilisateur.id, idParCle.get('transfert') ?? null);

  await supabase
    .from('imports')
    .update({ lignes_importees: importees, lignes_ignorees: ignorees })
    .eq('id', importCree.id);

  revalidatePath('/budget');
  revalidatePath('/dashboard');
  revalidatePath('/objectifs');

  return { ok: true, importees, ignorees, rejetees: analyse.rejets.length, transferts };
}

/**
 * Marque comme transferts les débits et crédits qui se reflètent d'un import à
 * l'autre. Renvoie le nombre de lignes nouvellement exclues du budget.
 */
async function marquerTransfertsMiroir(
  supabase: Awaited<ReturnType<typeof supabaseServeur>>,
  userId: string,
  categorieTransfertId: string | null,
): Promise<number> {
  const depuis = new Date();
  depuis.setUTCFullYear(depuis.getUTCFullYear() - 2);

  const { data } = await supabase
    .from('transactions')
    .select('id, date, montant_cents, import_id, exclue_du_budget')
    .eq('user_id', userId)
    .gte('date', depuis.toISOString().slice(0, 10));

  const lignes = (data ?? []).map((t) => ({
    id: t.id,
    date: t.date,
    montantCents: Number(t.montant_cents),
    importId: t.import_id,
    exclue: t.exclue_du_budget,
  }));

  const reflets = detecterTransfertsMiroir(lignes);
  const aMarquer = lignes.filter((t) => reflets.has(t.id) && !t.exclue).map((t) => t.id);
  if (aMarquer.length === 0) return 0;

  await supabase
    .from('transactions')
    .update({
      exclue_du_budget: true,
      ...(categorieTransfertId ? { category_id: categorieTransfertId } : {}),
    })
    .in('id', aMarquer);

  return aMarquer.length;
}

/** Annule un import complet — les transactions qu'il a créées disparaissent. */
export async function annulerImport(id: string): Promise<{ ok: boolean; message?: string }> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return { ok: false, message: 'Session expirée.' };

  const supabase = await supabaseServeur();

  const { error: erreurTransactions } = await supabase
    .from('transactions')
    .delete()
    .eq('import_id', id);
  if (erreurTransactions) return { ok: false, message: erreurTransactions.message };

  const { error } = await supabase.from('imports').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/budget');
  revalidatePath('/dashboard');

  return { ok: true };
}
