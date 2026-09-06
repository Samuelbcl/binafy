import { formatEUR, formatPercent } from '../money';
import { calculerCashNecessaire } from '../tax/enregistrement';
import { calculerImpotRevenusLocatifs } from '../tax/immobilier';
import { mergeSources, type CalcResult, type RegionFiscale, type TaxParamSet } from '../tax/types';
import { mensualite } from './credit';

/**
 * Rendement locatif belge (doc 07 § 4).
 *
 * Le chiffre qui compte n'est ni le rendement brut ni le rendement net de charges :
 * c'est le **cash-flow après impôt**. Un rendement brut de 6 % qui donne un cash-flow
 * négatif est un piège, et c'est le cas le plus fréquent.
 */

export type RendementLocatifInput = {
  /** Prix d'achat, en centimes. */
  prixCents: number;
  region: RegionFiscale;
  /** Loyer mensuel attendu, en centimes. */
  loyerMensuelCents: number;
  /** Revenu cadastral non indexé du bien, en centimes. */
  revenuCadastralCents: number;
  /** Taux marginal IPP du propriétaire, en ratio (0.45 pour 45 %). */
  tauxMarginal: number;
  /** Charges annuelles non récupérables, en centimes. */
  chargesAnnuellesCents?: number;
  /** Précompte immobilier annuel, en centimes. */
  precompteImmobilierAnnuelCents?: number;
  /** Taux de vacance locative annuel, en pourcentage. */
  vacancePourcent?: number;
  /** Frais de gestion locative, en pourcentage du loyer. */
  gestionPourcent?: number;
  /** Provision annuelle pour travaux, en centimes. */
  provisionTravauxAnnuelleCents?: number;
  /** Financement — laisser vide pour un achat comptant. */
  credit?: {
    /** Quotité empruntée, en pourcentage du prix. */
    quotitePourcent: number;
    tauxAnnuelPourcent: number;
    dureeAnnees: number;
  };
  /** Bien neuf : TVA au lieu des droits d'enregistrement. */
  neuf?: boolean;
};

export type RendementLocatifResult = {
  loyerAnnuelCents: number;
  /** Prix augmenté de tous les frais d'acquisition — la vraie base de calcul. */
  investissementTotalCents: number;
  fraisAcquisitionCents: number;
  rendementBrut: number;
  rendementNetCharges: number;
  rendementNetImpot: number;
  chargesTotalesAnnuellesCents: number;
  impotAnnuelCents: number;
  baseImposableCents: number;
  mensualiteCreditCents: number;
  /** Cash-flow mensuel après impôt — le seul chiffre qui compte. */
  cashFlowMensuelCents: number;
  cashFlowAnnuelCents: number;
  /** Effort d'épargne mensuel si le cash-flow est négatif. */
  effortMensuelCents: number;
};

export function calculerRendementLocatif(
  input: RendementLocatifInput,
  params: TaxParamSet,
): CalcResult<RendementLocatifResult> {
  const prix = Math.max(0, input.prixCents);
  const loyerMensuel = Math.max(0, input.loyerMensuelCents);
  const loyerAnnuelBrut = loyerMensuel * 12;

  // Frais d'acquisition : on réutilise le moteur des droits d'enregistrement.
  const acquisition = calculerCashNecessaire(
    {
      prixCents: prix,
      region: input.region,
      typeAchat: 'locatif',
      neuf: input.neuf,
      quotite: input.credit ? input.credit.quotitePourcent / 100 : 1,
    },
    params,
  );

  // Le total des frais d'acte, TVA comprise, tel que le notaire le facture.
  const fraisAcquisitionCents = acquisition.result.fraisActeAchatCents;
  const investissementTotalCents = prix + fraisAcquisitionCents;

  // Pertes récurrentes sur le loyer.
  const vacance = (input.vacancePourcent ?? 0) / 100;
  const gestion = (input.gestionPourcent ?? 0) / 100;
  const perteVacanceCents = Math.round(loyerAnnuelBrut * vacance);
  const fraisGestionCents = Math.round((loyerAnnuelBrut - perteVacanceCents) * gestion);
  const loyerAnnuelCents = loyerAnnuelBrut - perteVacanceCents;

  const charges = Math.max(0, input.chargesAnnuellesCents ?? 0);
  const precompte = Math.max(0, input.precompteImmobilierAnnuelCents ?? 0);
  const travaux = Math.max(0, input.provisionTravauxAnnuelleCents ?? 0);

  const chargesTotalesAnnuellesCents =
    charges + precompte + travaux + fraisGestionCents + perteVacanceCents;

  // Impôt : base = RC indexé majoré de 40 %, pas les loyers perçus.
  const impot = calculerImpotRevenusLocatifs(
    {
      revenuCadastralCents: input.revenuCadastralCents,
      usage: 'locatif_prive',
      loyerAnnuelCents: loyerAnnuelBrut,
      tauxMarginal: input.tauxMarginal,
    },
    params,
  );

  const mensualiteCreditCents = input.credit
    ? mensualite(
        Math.round(prix * (input.credit.quotitePourcent / 100)),
        input.credit.tauxAnnuelPourcent,
        Math.round(input.credit.dureeAnnees * 12),
      )
    : 0;

  const rendementBrut =
    investissementTotalCents > 0 ? loyerAnnuelBrut / investissementTotalCents : 0;
  const revenuNetCharges = loyerAnnuelBrut - chargesTotalesAnnuellesCents;
  const rendementNetCharges =
    investissementTotalCents > 0 ? revenuNetCharges / investissementTotalCents : 0;
  const revenuNetImpot = revenuNetCharges - impot.result.impotAnnuelCents;
  const rendementNetImpot =
    investissementTotalCents > 0 ? revenuNetImpot / investissementTotalCents : 0;

  const cashFlowAnnuelCents = revenuNetImpot - mensualiteCreditCents * 12;
  const cashFlowMensuelCents = Math.round(cashFlowAnnuelCents / 12);

  return {
    result: {
      loyerAnnuelCents,
      investissementTotalCents,
      fraisAcquisitionCents,
      rendementBrut,
      rendementNetCharges,
      rendementNetImpot,
      chargesTotalesAnnuellesCents,
      impotAnnuelCents: impot.result.impotAnnuelCents,
      baseImposableCents: impot.result.baseImposableCents,
      mensualiteCreditCents,
      cashFlowMensuelCents,
      cashFlowAnnuelCents,
      effortMensuelCents: cashFlowMensuelCents < 0 ? -cashFlowMensuelCents : 0,
    },
    breakdown: [
      { libelle: 'Prix d’achat', valeur: prix, unite: 'eur' },
      {
        libelle: 'Frais d’acquisition',
        valeur: fraisAcquisitionCents,
        unite: 'eur',
        precision: 'Droits d’enregistrement, notaire et débours',
      },
      {
        libelle: 'Investissement total',
        valeur: investissementTotalCents,
        unite: 'eur',
        precision: 'C’est cette base, et pas le prix seul, qui sert au calcul du rendement',
      },
      { libelle: 'Loyer annuel brut', valeur: loyerAnnuelBrut, unite: 'eur' },
      {
        libelle: 'Rendement brut',
        valeur: rendementBrut * 100,
        unite: 'pourcent',
        precision: `${formatEUR(loyerAnnuelBrut, { decimals: 0 })} / ${formatEUR(investissementTotalCents, { decimals: 0 })}`,
      },
      {
        libelle: 'Charges, vacance, gestion, précompte',
        valeur: -chargesTotalesAnnuellesCents,
        unite: 'eur',
      },
      {
        libelle: 'Rendement net de charges',
        valeur: rendementNetCharges * 100,
        unite: 'pourcent',
      },
      {
        libelle: 'Base imposable',
        valeur: impot.result.baseImposableCents,
        unite: 'eur',
        precision: 'Revenu cadastral indexé majoré de 40 % — pas les loyers perçus',
      },
      {
        libelle: 'Impôt annuel',
        valeur: -impot.result.impotAnnuelCents,
        unite: 'eur',
        precision: `Au taux marginal de ${formatPercent(input.tauxMarginal)}`,
      },
      {
        libelle: 'Rendement net d’impôt',
        valeur: rendementNetImpot * 100,
        unite: 'pourcent',
        total: true,
      },
      ...(mensualiteCreditCents > 0
        ? [
            {
              libelle: 'Mensualité de crédit',
              valeur: -mensualiteCreditCents,
              unite: 'eur' as const,
            },
          ]
        : []),
      {
        libelle: 'Cash-flow mensuel après impôt',
        valeur: cashFlowMensuelCents,
        unite: 'eur',
        precision:
          cashFlowMensuelCents < 0
            ? `Ce bien te coûte ${formatEUR(-cashFlowMensuelCents)} par mois. C’est un effort d’épargne, pas forcément un mauvais investissement — mais il faut pouvoir le porter.`
            : 'Ce bien s’autofinance et dégage un excédent',
        total: true,
      },
    ],
    sources: mergeSources(acquisition.sources, impot.sources),
    hypotheses: [
      ...impot.hypotheses,
      'Le rendement est calculé sur l’investissement total, frais d’acquisition compris — c’est la seule base honnête.',
      'L’amortissement du capital emprunté n’est pas compté comme une charge : c’est de l’épargne forcée, pas une perte.',
      'La revalorisation éventuelle du bien n’est pas prise en compte.',
    ],
  };
}
