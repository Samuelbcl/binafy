'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TEINTES } from '@/components/ui/pastille-icone';
import { supabaseServeur, utilisateurCourant } from '@/lib/db/serveur';
import { CLES_ICONE, FREQUENCES, TYPES_OBJECTIF } from '@/lib/objectifs/types';

/**
 * Server Actions du module objectifs.
 *
 * Le parcours de création tient en trois écrans côté client et n'envoie qu'un
 * seul objet à la fin : on valide cet objet ici, entièrement, quoi que le
 * client ait déjà vérifié. La RLS empêche d'écrire chez quelqu'un d'autre ;
 * elle n'empêche pas d'écrire n'importe quoi chez soi.
 */

export type ResultatAction = { ok: true; id: string } | { ok: false; message: string };

const MAX_CENTS = 100_000_000_000; // un milliard d'euros, en centimes

const schemaCreation = z.object({
  nom: z.string().trim().min(1, 'Donne un nom à cet objectif.').max(80),
  icone: z.enum(CLES_ICONE),
  teinte: z.enum(TEINTES),
  inspiration: z.string().max(40).nullable(),
  type: z.enum(TYPES_OBJECTIF),
  cibleCents: z
    .number()
    .int()
    .min(100, 'La cible doit valoir au moins un euro.')
    .max(MAX_CENTS, 'Cette cible n’est pas vraisemblable.'),
  echeance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Cette date n’est pas valide.')
    .nullable(),
  contributionCents: z.number().int().min(0).max(MAX_CENTS).nullable(),
  frequence: z.enum(FREQUENCES).nullable(),
  actifsLies: z.array(z.string().uuid()).max(20),
});

export type DonneesCreation = z.input<typeof schemaCreation>;

export async function creerObjectif(donnees: unknown): Promise<ResultatAction> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) {
    return { ok: false, message: 'En mode démo, rien n’est enregistré. Connecte-toi pour garder cet objectif.' };
  }

  const lecture = schemaCreation.safeParse(donnees);
  if (!lecture.success) {
    return { ok: false, message: lecture.error.issues[0]?.message ?? 'Ces valeurs ne sont pas valides.' };
  }
  const o = lecture.data;

  // Un rythme sans montant, ou un montant sans rythme, ne veut rien dire.
  const contribution = o.contributionCents && o.contributionCents > 0 ? o.contributionCents : null;
  const frequence = contribution ? o.frequence : null;

  const supabase = await supabaseServeur();
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: utilisateur.id,
      nom: o.nom,
      type: o.type,
      montant_cible_cents: o.cibleCents,
      echeance: o.echeance,
      parametres: {
        icone: o.icone,
        teinte: o.teinte,
        contribution_cents: contribution,
        frequence,
        inspiration: o.inspiration,
      },
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, message: 'L’enregistrement a échoué. Réessaie dans un instant.' };
  }

  if (o.actifsLies.length > 0) {
    // La RLS de goal_assets vérifie que l'objectif est à nous ; celle des
    // actifs n'est pas consultée ici, mais un identifiant d'actif étranger ne
    // vaudra jamais rien : il ne sera jamais dans la liste qu'on relit.
    const { error: erreurLiens } = await supabase
      .from('goal_assets')
      .insert(o.actifsLies.map((asset_id) => ({ goal_id: data.id, asset_id })));
    if (erreurLiens) {
      await supabase.from('goals').delete().eq('id', data.id);
      return { ok: false, message: 'Le rattachement des actifs a échoué. Réessaie.' };
    }
  }

  revalidatePath('/objectifs');
  revalidatePath('/dashboard');
  return { ok: true, id: data.id };
}

export async function supprimerObjectif(id: string): Promise<void> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return;
  if (!z.string().uuid().safeParse(id).success) return;

  const supabase = await supabaseServeur();
  // La cascade emporte les rattachements ; la RLS limite à ses propres lignes.
  await supabase.from('goals').delete().eq('id', id);

  revalidatePath('/objectifs');
  revalidatePath('/dashboard');
}
