import { calculerDroitsEnregistrement, coutOrdreAchat } from '@/lib/tax/enregistrement';
import { calculerEpargnePension } from '@/lib/tax/epargne-fiscale';
import { calculerEpargnePrecaution } from '@/lib/finance/epargne';
import { calculerRendementLocatif } from '@/lib/finance/locatif';
import { calculerImpotRevenusLocatifs } from '@/lib/tax/immobilier';
import {
  calculerCotisationsSociales,
  calculerCoutDemarrage,
  simulerIndependant,
} from '@/lib/tax/independant';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import {
  calculerPrecompteDividendes,
  calculerPrecompteEpargneReglementee,
  calculerPrecompteInterets,
} from '@/lib/tax/precompte';
import { calculerTaxePlusValues } from '@/lib/tax/plus-values';
import { calculerTOBAllerRetour } from '@/lib/tax/tob';
import type { CalcResult } from '@/lib/tax/types';

/**
 * Démonstrations chiffrées des guides.
 *
 * Chaque entrée appelle **le même calculateur que l'application**, avec les mêmes
 * paramètres fiscaux. Un guide ne peut donc pas afficher un chiffre que l'app
 * contredirait : si le taux change dans `parametres.ts`, le texte du guide suit
 * sans qu'on y touche.
 *
 * Les entrées sont choisies pour être plausibles pour la cible — quelqu'un qui
 * place quelques milliers d'euros, pas un patrimoine de gestion privée.
 */

export type Demonstration = {
  /** L'énoncé, en français, de la situation calculée. */
  enonce: string;
  resultat: CalcResult<unknown>;
};

const P = TAX_PARAMS_2026;

export const DEMONSTRATIONS: Record<string, () => Demonstration> = {
  /** Le calcul qui fait exister l'alerte « à récupérer » du tableau de bord. */
  'dividendes-recuperation': () => ({
    enonce:
      'Tu as encaissé 1 240 € de dividendes sur l’année. Ton courtier a retenu le précompte à la source, comme il y est obligé.',
    resultat: calculerPrecompteDividendes(
      { dividendesBrutsCents: 124_000, precompteRetenuCents: 37_200 },
      P,
    ),
  }),

  /** Montre que l'exonération porte sur le dividende, pas sur le précompte. */
  'dividendes-petit-portefeuille': () => ({
    enonce:
      'Un portefeuille plus modeste : 400 € de dividendes sur l’année, précompte retenu à la source.',
    resultat: calculerPrecompteDividendes(
      { dividendesBrutsCents: 40_000, precompteRetenuCents: 12_000 },
      P,
    ),
  }),

  /** Le coût d'un aller-retour sur un ETF, souvent ignoré à l'achat. */
  'tob-aller-retour-etf': () => ({
    enonce:
      'Tu achètes pour 3 000 € d’un ETF capitalisant inscrit à la distribution en Belgique, puis tu revends la même somme.',
    resultat: calculerTOBAllerRetour(
      { montantAchatCents: 300_000, montantVenteCents: 300_000, support: 'capitalisant_belge' },
      P,
    ),
  }),

  /** La taxe de 2026 sur une plus-value modeste : souvent nulle, il faut le dire. */
  'plus-value-sous-exoneration': () => ({
    enonce:
      'Tu revends des parts avec 4 200 € de plus-value, réalisée après le 1er janvier 2026, sans autre vente dans l’année.',
    resultat: calculerTaxePlusValues({ plusValueCents: 420_000 }, P),
  }),

  /** La même mécanique au-delà de l'exonération annuelle. */
  'plus-value-au-dessus': () => ({
    enonce:
      'Même opération, mais 18 000 € de plus-value cette fois — un cas plus rare, utile pour voir où l’exonération s’arrête.',
    resultat: calculerTaxePlusValues({ plusValueCents: 1_800_000 }, P),
  }),

  /** Le compte d'épargne réglementé et son exonération propre. */
  'epargne-reglementee': () => ({
    enonce:
      'Un compte d’épargne réglementé de 6 800 € rémunéré 0,90 % de taux de base et 0,60 % de prime de fidélité, sur une année complète.',
    resultat: calculerPrecompteEpargneReglementee(
      { interetsBaseCents: 6_120, primeFideliteCents: 4_080 },
      P,
    ),
  }),

  // ── Droits d'enregistrement ──────────────────────────────────────────
  /** Le cas courant : habitation propre et unique en Wallonie. */
  'enregistrement-taux-reduit': () => ({
    enonce:
      'Une maison à 280 000 € en Wallonie, destinée à devenir ton habitation propre et unique.',
    resultat: calculerDroitsEnregistrement(
      { prixCents: 28_000_000, region: 'wallonie', typeAchat: 'propre_unique' },
      P,
    ),
  }),

  /** Le même bien, hors conditions du taux réduit. */
  'enregistrement-taux-plein': () => ({
    enonce:
      'Le même bien à 280 000 €, mais acheté pour le louer, ou alors que tu détiens déjà un autre logement.',
    resultat: calculerDroitsEnregistrement(
      { prixCents: 28_000_000, region: 'wallonie', typeAchat: 'locatif' },
      P,
    ),
  }),

  /** Le piège du guide : le locatif acheté avant la résidence principale. */
  'ordre-achat-locatif-avant': () => ({
    enonce:
      'Tu achètes d’abord un studio locatif à 180 000 €, puis ta résidence principale à 280 000 € quelques années plus tard.',
    resultat: coutOrdreAchat(
      {
        prixLocatifEnvisageCents: 18_000_000,
        prixResidencePrincipaleFutureCents: 28_000_000,
        region: 'wallonie',
      },
      P,
    ),
  }),

  // ── Épargne-pension ──────────────────────────────────────────────────
  /** Le plafond bas, celui qui rapporte le plus par euro versé. */
  'epargne-pension-plafond-bas': () => ({
    enonce: 'Tu verses le montant du plafond bas sur ton épargne-pension cette année.',
    resultat: calculerEpargnePension({ versementCents: 105_000 }, P),
  }),

  /** Le piège : verser plus rapporte moins par euro. */
  'epargne-pension-entre-deux': () => ({
    enonce:
      'Tu verses 300 € de plus, en pensant que la réduction d’impôt suivra proportionnellement.',
    resultat: calculerEpargnePension({ versementCents: 135_000 }, P),
  }),

  // ── Rendement locatif ────────────────────────────────────────────────
  /** L'écart entre le rendement brut affiché et le cash-flow réel. */
  'rendement-locatif-reel': () => ({
    enonce:
      'Un appartement à 200 000 € en Wallonie, loué 850 € par mois à un particulier, revenu cadastral de 900 €, financé à 80 % sur 25 ans à 3,5 %.',
    resultat: calculerRendementLocatif(
      {
        prixCents: 20_000_000,
        region: 'wallonie',
        loyerMensuelCents: 85_000,
        revenuCadastralCents: 90_000,
        tauxMarginal: 0.5,
        chargesAnnuellesCents: 120_000,
        precompteImmobilierAnnuelCents: 80_000,
        vacancePourcent: 5,
        provisionTravauxAnnuelleCents: 100_000,
        credit: { quotitePourcent: 80, tauxAnnuelPourcent: 3.5, dureeAnnees: 25 },
      },
      P,
    ),
  }),

  // ── Compte d'épargne réglementé ──────────────────────────────────────
  /** Au-delà de l'exonération, seul l'excédent est taxé, au taux réduit. */
  'epargne-reglementee-au-dela': () => ({
    enonce:
      'Tes comptes d’épargne réglementés te rapportent 1 240 € d’intérêts sur l’année, tous comptes confondus.',
    resultat: calculerPrecompteEpargneReglementee(
      { interetsBaseCents: 74_400, primeFideliteCents: 49_600 },
      P,
    ),
  }),

  /** Le même montant, sur un compte qui n'est pas réglementé. */
  'interets-non-reglementes': () => ({
    enonce:
      'Les mêmes 1 240 € d’intérêts, mais sur un compte à terme ou un compte d’épargne non réglementé.',
    resultat: calculerPrecompteInterets({ interetsCents: 124_000 }, P),
  }),

  /** La zone perdante : plus versé, moins rendu. */
  'epargne-pension-zone-perdante': () => ({
    enonce:
      'Tu verses 1 200 €, en pensant faire un effort raisonnable au-delà du plafond bas.',
    resultat: calculerEpargnePension({ versementCents: 120_000 }, P),
  }),

  /** Le point où le plafond haut rattrape enfin le plafond bas. */
  'epargne-pension-bascule': () => ({
    enonce: 'Tu verses le montant exact à partir duquel le plafond haut rend autant que le bas.',
    resultat: calculerEpargnePension({ versementCents: 126_000 }, P),
  }),

  /** Le régime belge : l'impôt porte sur le revenu cadastral, pas sur le loyer. */
  'impot-locatif-particulier': () => ({
    enonce:
      'Un studio au revenu cadastral de 750 €, loué 850 € par mois à un particulier qui y habite. Tu es dans la tranche marginale à 45 %.',
    resultat: calculerImpotRevenusLocatifs(
      {
        revenuCadastralCents: 75_000,
        usage: 'locatif_prive',
        loyerAnnuelCents: 1_020_000,
        tauxMarginal: 0.45,
      },
      P,
    ),
  }),

  /** Le piège : même bien, même loyer, locataire professionnel. */
  'impot-locatif-professionnel': () => ({
    enonce:
      'Le même studio, le même loyer — mais loué à une société qui en fait son bureau.',
    resultat: calculerImpotRevenusLocatifs(
      {
        revenuCadastralCents: 75_000,
        usage: 'locatif_pro',
        loyerAnnuelCents: 1_020_000,
        tauxMarginal: 0.45,
      },
      P,
    ),
  }),

  // ── Indépendant complémentaire ───────────────────────────────────────
  /** Le couperet : franchir le seuil déclenche la cotisation sur tout. */
  'independant-seuil-couperet': () => ({
    enonce:
      'Ton activité complémentaire dégage 2 000 € de revenu net dans l’année — à peine au-dessus du seuil d’exemption.',
    resultat: calculerCotisationsSociales(
      { revenuNetImposableCents: 200_000, statut: 'complementaire' },
      P,
    ),
  }),

  /** Du chiffre facturé à ce qui reste, cotisations et impôt marginal compris. */
  'independant-du-brut-au-net': () => ({
    enonce:
      'Tu factures 6 000 € sur l’année, avec 600 € de frais professionnels, à côté d’un salaire imposable de 34 000 €. Additionnels communaux moyens.',
    resultat: simulerIndependant(
      {
        chiffreAffairesCents: 600_000,
        chargesCents: 60_000,
        statut: 'complementaire',
        revenuSalarieCents: 3_400_000,
      },
      P,
    ),
  }),

  /** Ce qu'il faut sortir avant la première facture. */
  'independant-demarrage': () => ({
    enonce: 'Tu t’inscris à la BCE et tu actives un numéro de TVA via un guichet d’entreprises.',
    resultat: calculerCoutDemarrage({ avecTVA: true }, P),
  }),

  /**
   * Le matelas de sécurité se calcule sur les charges fixes, pas sur les
   * dépenses : c'est la même fonction que l'objectif « matelas » de l'app.
   */
  'matelas-trois-mois': () => ({
    enonce:
      'Tes charges fixes tournent autour de 1 100 € par mois — loyer, énergie, abonnements, assurances. Tu vises trois mois de couverture, le bas de la fourchette, et tu as déjà 1 800 € de côté. Tu épargnes 200 € par mois.',
    resultat: calculerEpargnePrecaution({
      chargesFixesMensuellesCents: 110_000,
      moisDeCouverture: 3,
      dejaEpargneCents: 180_000,
      capaciteEpargneMensuelleCents: 20_000,
    }),
  }),

  'matelas-six-mois': () => ({
    enonce:
      'Mêmes charges fixes, même épargne déjà là, même rythme de 200 € par mois — mais tu vises six mois, parce que ton ménage vit sur un seul revenu.',
    resultat: calculerEpargnePrecaution({
      chargesFixesMensuellesCents: 110_000,
      moisDeCouverture: 6,
      dejaEpargneCents: 180_000,
      capaciteEpargneMensuelleCents: 20_000,
    }),
  }),
};

export function demonstration(cle: string): Demonstration | null {
  const fabrique = DEMONSTRATIONS[cle];
  return fabrique ? fabrique() : null;
}
