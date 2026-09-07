import 'server-only';

import { chargerBudget } from '../db/budget';
import { chargerObjectifs } from '../db/objectifs';
import { chargerPatrimoine } from '../db/patrimoine';
import { PROFIL_DEMO } from '../demo/donnees';
import { calculerTauxEpargneCompare } from '../finance/epargne';
import { valeurQuotePart, type Actif } from '../patrimoine/types';
import type { Objectif } from './types';
import type { RegionFiscale } from '../tax/types';

/**
 * Tout ce dont les écrans d'objectifs ont besoin, chargé une fois.
 *
 * Les objectifs ne vivent pas seuls : leur progression vient du patrimoine,
 * la cible du matelas vient du budget, l'apport vient de la Région. Plutôt que
 * de laisser chaque page refaire ces trois lectures dans le désordre, on les
 * assemble ici, et les pages n'ont plus qu'à afficher.
 */

/** Les postes du budget qu'on considère comme des charges fixes. */
const POSTES_FIXES = ['logement', 'transport', 'abonnements'];

export type ContexteObjectifs = {
  actifs: readonly Actif[];
  objectifs: readonly Objectif[];
  demo: boolean;
  /** Charges fixes mensuelles constatées : la base du matelas de sécurité. */
  chargesFixesCents: number;
  /** Ce qui reste en moyenne chaque mois, lissé sur douze mois. */
  capaciteMensuelleCents: number;
  /** Comptes courants et d'épargne : ce qui est disponible tout de suite. */
  epargneLiquideCents: number;
  region: RegionFiscale;
};

export async function chargerContexteObjectifs(): Promise<ContexteObjectifs> {
  const [patrimoine, budget] = await Promise.all([chargerPatrimoine(), chargerBudget()]);
  const { objectifs, demo } = await chargerObjectifs(patrimoine.actifs);

  const compare = calculerTauxEpargneCompare(budget.mois);
  const capaciteMensuelleCents = Math.max(
    0,
    Math.round(
      compare.result.lisse12Mois.nonDepenseCents / (compare.result.lisse12Mois.moisComptes || 1),
    ),
  );

  const chargesFixesCents = budget.categories
    .filter((c) => c.type === 'depense' && POSTES_FIXES.includes(c.cle.toLowerCase()))
    .reduce((somme, c) => somme + c.montantCents, 0);

  const epargneLiquideCents = patrimoine.actifs
    .filter((a) => a.classe === 'compte_epargne' || a.classe === 'compte_courant')
    .reduce((somme, a) => somme + valeurQuotePart(a), 0);

  return {
    actifs: patrimoine.actifs,
    objectifs,
    demo: demo || patrimoine.demo,
    chargesFixesCents,
    capaciteMensuelleCents,
    epargneLiquideCents,
    region: PROFIL_DEMO.region,
  };
}
