'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseServeur, utilisateurCourant } from '@/lib/db/serveur';
import { euros } from '@/lib/money';
import { CLASSES_ACTIF, type ClasseActif } from '@/lib/patrimoine/types';

/**
 * Server Actions du module patrimoine.
 *
 * La RLS est la vraie barrière de sécurité, mais elle ne remplace pas la
 * validation : une policy empêche d'écrire chez quelqu'un d'autre, elle
 * n'empêche pas d'écrire n'importe quoi chez soi.
 */

export type ResultatAction = { ok: true } | { ok: false; message: string };

/**
 * Un montant saisi en euros, converti en centimes entiers.
 * La virgule décimale belge est acceptée telle quelle : personne ne tape un point.
 */
const MAX_EUROS = 1_000_000_000;

const montantEuros = z.string().trim().transform((valeur, ctx) => {
  const nombre = Number(valeur.replace(',', '.'));
  if (!Number.isFinite(nombre) || nombre < 0 || nombre > MAX_EUROS) {
    ctx.addIssue({ code: 'custom', message: 'Ce montant n’est pas valide.' });
    return z.NEVER;
  }
  return euros(nombre);
});

/** Même chose, mais un champ vide vaut « non renseigné » plutôt qu'une erreur. */
const montantOptionnel = z.string().trim().transform((valeur, ctx) => {
  if (valeur === '') return null;
  const nombre = Number(valeur.replace(',', '.'));
  if (!Number.isFinite(nombre) || nombre < 0 || nombre > MAX_EUROS) {
    ctx.addIssue({ code: 'custom', message: 'Ce montant n’est pas valide.' });
    return z.NEVER;
  }
  return euros(nombre);
});

const dateOptionnelle = z.string().trim().transform((valeur, ctx) => {
  if (valeur === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
    ctx.addIssue({ code: 'custom', message: 'Cette date n’est pas valide.' });
    return z.NEVER;
  }
  return valeur;
});

const schemaActif = z.object({
  nom: z.string().trim().min(1, 'Donne un nom à cet actif.').max(120),
  classe: z.enum(CLASSES_ACTIF as unknown as [ClasseActif, ...ClasseActif[]]),
  valeur: montantEuros,
  institution: z.string().trim().max(120).optional(),
  quotePart: z
    .string()
    .trim()
    .transform((v) => (v === '' ? 100 : Number(v.replace(',', '.'))))
    .pipe(z.number().min(0.01).max(100)),
  prixAcquisition: montantOptionnel.optional(),
  valeurReference2025: montantOptionnel.optional(),
  dateAcquisition: dateOptionnelle.optional(),
  // Une case a cocher non cochee n'est pas envoyee du tout par le navigateur.
  capitalisant: z.literal('true').optional(),
  inscritEnBelgique: z.literal('true').optional(),
});

/** Classes valorisées par un solde plutôt que par quantité × cours. */
const CLASSES_A_SOLDE: ClasseActif[] = ['compte_courant', 'compte_epargne', 'creance', 'autre'];

export async function creerActif(_precedent: unknown, donnees: FormData): Promise<ResultatAction> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) {
    return { ok: false, message: 'Session expirée. Reconnecte-toi.' };
  }

  const brut = Object.fromEntries(donnees.entries());
  const valide = schemaActif.safeParse(brut);

  if (!valide.success) {
    return {
      ok: false,
      message: valide.error.issues[0]?.message ?? 'Ces valeurs ne sont pas valides.',
    };
  }

  const a = valide.data;
  const supabase = await supabaseServeur();

  // Un compte porte un solde ; une position porte une valeur de marché. On range
  // la valeur dans la bonne colonne pour que le calcul en aval retombe juste.
  const aSolde = CLASSES_A_SOLDE.includes(a.classe);

  const { data: actifCree, error } = await supabase
    .from('assets')
    .insert({
      user_id: utilisateur.id,
      nom: a.nom,
      classe: a.classe,
      solde_cents: aSolde ? a.valeur : null,
      quantite: aSolde ? null : 1,
      valeur_unitaire_cents: aSolde ? null : a.valeur,
      prix_acquisition_cents: a.prixAcquisition ?? null,
      valeur_reference_2025_cents: a.valeurReference2025 ?? null,
      date_acquisition: a.dateAcquisition ?? null,
      capitalisant: a.capitalisant === 'true' ? true : null,
      inscrit_en_belgique: a.inscritEnBelgique === 'true' ? true : null,
      compte_epargne_reglemente: a.classe === 'compte_epargne' ? true : null,
      est_manuel: true,
    })
    .select('id')
    .single();

  if (error || !actifCree) {
    return { ok: false, message: `Enregistrement impossible : ${error?.message ?? 'inconnu'}` };
  }

  // Quote-part : on ne l'écrit que si elle diffère de 100 %, sinon la table
  // se remplirait de lignes qui ne disent rien.
  if (a.quotePart < 100) {
    const { data: detenteur } = await supabase
      .from('holders')
      .select('id')
      .eq('est_utilisateur', true)
      .limit(1)
      .maybeSingle();

    if (detenteur) {
      await supabase
        .from('asset_holders')
        .insert({ asset_id: actifCree.id, holder_id: detenteur.id, quote_part: a.quotePart });
    }
  }

  revalidatePath('/patrimoine');
  revalidatePath('/dashboard');
  revalidatePath('/fiscalite');

  return { ok: true };
}

export async function supprimerActif(id: string): Promise<ResultatAction> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return { ok: false, message: 'Session expirée. Reconnecte-toi.' };

  const supabase = await supabaseServeur();

  // On archive plutôt que de supprimer : l'historique des snapshots et les
  // événements fiscaux passés perdraient leur sens sans la ligne d'origine.
  const { error } = await supabase.from('assets').update({ archive: true }).eq('id', id);

  if (error) return { ok: false, message: `Suppression impossible : ${error.message}` };

  revalidatePath('/patrimoine');
  revalidatePath('/dashboard');

  return { ok: true };
}
