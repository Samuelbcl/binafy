import type { Metadata } from 'next';
import { CreationObjectif } from '@/components/objectifs/creation-objectif';
import { chargerContexteObjectifs } from '@/lib/objectifs/contexte';
import { valeurQuotePart } from '@/lib/patrimoine/types';

export const metadata: Metadata = {
  title: 'Nouvel objectif',
  description: 'Un nom, une cible, une date. Nestor projette le reste.',
};

/**
 * Page de création. Elle ne fait que charger ce que le parcours a besoin de
 * savoir — les actifs à rattacher, les charges fixes pour le matelas, la
 * capacité d'épargne pour suggérer un rythme — et laisse le client faire les
 * trois écrans. Sur le web dès le premier jour, là où d'autres renvoient au
 * téléphone (doc 02 § module 5).
 */
export default async function NouvelObjectifPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { inspiration } = await searchParams;
  const contexte = await chargerContexteObjectifs();

  return (
    <CreationObjectif
      actifs={contexte.actifs.map((a) => ({ id: a.id, nom: a.nom, valeurCents: valeurQuotePart(a) }))}
      chargesFixesCents={contexte.chargesFixesCents}
      capaciteMensuelleCents={contexte.capaciteMensuelleCents}
      region={contexte.region}
      inspirationInitiale={typeof inspiration === 'string' ? inspiration : null}
    />
  );
}
