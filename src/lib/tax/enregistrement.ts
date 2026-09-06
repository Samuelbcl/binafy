import { formatEUR, formatTaux } from '../money';
import {
  type BreakdownLine,
  appliquerBaremeProgressif,
  getBareme,
  getCents,
  getParam,
  getRate,
  LIBELLE_REGION,
  mergeSources,
  toSource,
  type CalcResult,
  type RegionFiscale,
  type SourceRef,
  type TaxParamSet,
} from './types';

/**
 * Droits d'enregistrement et frais d'acquisition immobilière (doc 06 § 2, doc 07 § 3).
 *
 * C'est le module qui justifie l'app pour la cible : en Wallonie, l'écart entre le
 * taux réduit de 3 % et le taux plein de 12,5 % dépasse 26 000 € sur un bien à
 * 280 000 €. Acheter un locatif avant sa résidence principale fait perdre ce taux
 * réduit. On chiffre l'arbitrage, on n'ordonne rien (doc 01 § cadre réglementaire).
 */

export type TypeAchat = 'propre_unique' | 'autre' | 'locatif';

export const LIBELLE_TYPE_ACHAT: Record<TypeAchat, string> = {
  propre_unique: 'Habitation propre et unique',
  autre: 'Autre bien d’habitation',
  locatif: 'Investissement locatif',
};

export type DroitsInput = {
  /** Prix d'achat, en centimes. */
  prixCents: number;
  region: RegionFiscale;
  typeAchat: TypeAchat;
  /** Bien neuf : TVA à 21 % en lieu et place des droits d'enregistrement. */
  neuf?: boolean;
};

export type DroitsResult = {
  montantCents: number;
  /** `enregistrement` ou `tva` selon le régime applicable. */
  regime: 'enregistrement' | 'tva';
  tauxApplique: number;
  abattementCents: number;
};

export function calculerDroitsEnregistrement(
  input: DroitsInput,
  params: TaxParamSet,
): CalcResult<DroitsResult> {
  const prix = Math.max(0, input.prixCents);

  if (input.neuf) {
    const pTva = getParam(params, 'immobilier.tva_neuf');
    const taux = getRate(params, 'immobilier.tva_neuf');
    const montantCents = Math.round(prix * taux);
    return {
      result: { montantCents, regime: 'tva', tauxApplique: taux, abattementCents: 0 },
      breakdown: [
        { libelle: 'Prix d’achat', valeur: prix, unite: 'eur' },
        {
          libelle: 'TVA sur bien neuf',
          valeur: montantCents,
          unite: 'eur',
          precision: `${formatEUR(prix)} × ${formatTaux(pTva.valeur, 0)} — la TVA remplace les droits d'enregistrement`,
          total: true,
        },
      ],
      sources: [toSource(pTva)],
      hypotheses: [
        'Un bien neuf vendu sous régime TVA échappe aux droits d’enregistrement sur la construction, mais les droits restent dus sur la quote-part du terrain dans certains cas.',
      ],
    };
  }

  const cleTaux =
    input.typeAchat === 'propre_unique'
      ? 'droits_enregistrement.propre_unique'
      : 'droits_enregistrement.autre';

  const pTaux = getParam(params, cleTaux, input.region);
  const taux = getRate(params, cleTaux, input.region);
  const sources: SourceRef[] = [toSource(pTaux)];

  // Abattement sur la première tranche — mécanique bruxelloise.
  let abattementCents = 0;
  if (input.typeAchat === 'propre_unique') {
    const pAbattement = getParam(params, 'droits_enregistrement.abattement', input.region);
    sources.push(toSource(pAbattement));
    const abattementBrut = getCents(params, 'droits_enregistrement.abattement', input.region);

    if (abattementBrut > 0) {
      const pPrixMax = params.parametres.find(
        (p) => p.cle === 'droits_enregistrement.abattement_prix_max' && p.region === input.region,
      );
      const prixMaxCents = pPrixMax ? Math.round(pPrixMax.valeur * 100) : Number.POSITIVE_INFINITY;
      if (pPrixMax) sources.push(toSource(pPrixMax));

      if (prix <= prixMaxCents) {
        abattementCents = Math.min(abattementBrut, prix);
      }
    }
  }

  const baseCents = Math.max(0, prix - abattementCents);
  const montantCents = Math.round(baseCents * taux);

  const breakdown: BreakdownLine[] = [
    { libelle: 'Prix d’achat', valeur: prix, unite: 'eur' as const },
    {
      libelle: `Taux applicable — ${LIBELLE_TYPE_ACHAT[input.typeAchat]}`,
      valeur: pTaux.valeur,
      unite: 'pourcent' as const,
      precision: LIBELLE_REGION[input.region],
    },
  ];

  if (abattementCents > 0) {
    breakdown.push({
      libelle: 'Abattement sur la première tranche',
      valeur: -abattementCents,
      unite: 'eur' as const,
      precision: 'Tranche exonérée de droits pour une habitation propre et unique',
    });
    breakdown.push({ libelle: 'Base taxable', valeur: baseCents, unite: 'eur' as const });
  }

  breakdown.push({
    libelle: 'Droits d’enregistrement',
    valeur: montantCents,
    unite: 'eur' as const,
    precision: `${formatEUR(baseCents)} × ${formatTaux(pTaux.valeur)}`,
    total: true,
  });

  const hypotheses: string[] = [];
  if (input.typeAchat === 'propre_unique' && input.region === 'wallonie') {
    const pDuree = params.parametres.find(
      (p) => p.cle === 'droits_enregistrement.duree_maintien_residence' && p.region === 'wallonie',
    );
    const duree = pDuree?.valeur ?? 3;
    hypotheses.push(
      `Le taux réduit wallon suppose : acquisition en pleine propriété, établissement de la résidence principale dans le délai légal et maintien pendant au moins ${duree} ans, et absence d'un autre immeuble d'habitation détenu en pleine propriété à la date de l'acte.`,
      'Le non-respect de ces conditions entraîne le rappel de la différence de droits, majorée d’intérêts.',
    );
  }

  return {
    result: { montantCents, regime: 'enregistrement', tauxApplique: taux, abattementCents },
    breakdown,
    sources,
    hypotheses,
  };
}

/**
 * Honoraires du notaire pour l'acte d'achat.
 *
 * Depuis la réforme du 01/01/2023, le tarif comporte une partie fixe en plus
 * des tranches dégressives, et distingue deux barèmes : le **J** pour le cas
 * général, le **Jbis**, réduit, pour l'acquisition en pleine propriété d'un
 * immeuble que les acquéreurs occuperont comme habitation propre et unique.
 *
 * Le Jbis est le cas le plus fréquent de la cible : l'ignorer surestimait les
 * honoraires d'environ 11 %.
 */
export function calculerHonorairesNotaire(
  input: { prixCents: number; typeAchat?: TypeAchat },
  params: TaxParamSet,
): CalcResult<{
  honorairesHTVACents: number;
  tvaCents: number;
  totalCents: number;
  bareme: 'J' | 'Jbis';
}> {
  const prix = Math.max(0, input.prixCents);
  const { tranches, sources } = getBareme(params, 'notaire.achat');
  const pTva = getParam(params, 'notaire.tva_honoraires');
  const tauxTva = getRate(params, 'notaire.tva_honoraires');

  const pPartieFixe = getParam(params, 'notaire.achat.partie_fixe');
  const partieFixeCents = getCents(params, 'notaire.achat.partie_fixe');

  const { impotCents: parTranches, detail } = appliquerBaremeProgressif(prix, tranches);

  // Le barème réduit ne s'applique qu'à l'habitation propre et unique.
  const jbis = input.typeAchat === 'propre_unique';
  const pReduction = getParam(params, 'notaire.achat.reduction_jbis');
  const reductionCents = jbis ? getCents(params, 'notaire.achat.reduction_jbis') : 0;

  // Un prix nul ne produit pas d'honoraires : la partie fixe ne s'ajoute qu'à
  // un acte réel.
  const brutCents = prix > 0 ? parTranches + partieFixeCents : 0;
  const honorairesHTVACents = Math.max(0, brutCents - reductionCents);
  const tvaCents = Math.round(honorairesHTVACents * tauxTva);
  const totalCents = honorairesHTVACents + tvaCents;

  const breakdown: BreakdownLine[] = detail.map((ligne) => ({
    libelle: `Tranche à ${formatTaux(ligne.taux * 100)}`,
    valeur: ligne.impotCents,
    unite: 'eur' as const,
    precision: `De ${formatEUR(ligne.deCents, { decimals: 0 })} à ${
      Number.isFinite(ligne.aCents) ? formatEUR(ligne.aCents, { decimals: 0 }) : 'au-delà'
    }`,
  }));

  if (prix > 0) {
    breakdown.push({
      libelle: 'Partie fixe',
      valeur: partieFixeCents,
      unite: 'eur',
      precision: 'Ajoutée aux tranches depuis la réforme du tarif de 2023',
    });
  }

  if (jbis && reductionCents > 0) {
    breakdown.push({
      libelle: 'Réduction — barème Jbis',
      valeur: -reductionCents,
      unite: 'eur',
      precision: 'Habitation propre et unique : le tarif prévoit un barème réduit',
    });
  }

  breakdown.push(
    { libelle: 'Honoraires hors TVA', valeur: honorairesHTVACents, unite: 'eur' },
    {
      libelle: 'TVA sur honoraires',
      valeur: tvaCents,
      unite: 'eur',
      precision: formatTaux(pTva.valeur, 0),
    },
    { libelle: 'Honoraires TVAC', valeur: totalCents, unite: 'eur', total: true },
  );

  return {
    result: { honorairesHTVACents, tvaCents, totalCents, bareme: jbis ? 'Jbis' : 'J' },
    breakdown,
    sources: mergeSources(sources, [toSource(pTva), toSource(pPartieFixe)], jbis ? [toSource(pReduction)] : []),
    hypotheses: [
      'Le barème des honoraires notariaux est légal : il est identique chez tous les notaires belges.',
      jbis
        ? "Le barème réduit suppose que tu occuperas le bien comme habitation propre et unique, et que tu n'as aucun autre droit réel immobilier. Le domicile doit y être établi dans l'année, sous peine de devoir verser la différence au notaire."
        : 'Une acquisition destinée à devenir ton habitation propre et unique donnerait droit à un barème réduit.',
      'La partie fixe et la réduction du barème réduit sont calibrées sur le calculateur de notaire.be pour un prix de 280 000 €. Elles restent à confirmer sur d’autres montants.',
    ],
  };
}

export type CashNecessaireInput = {
  prixCents: number;
  region: RegionFiscale;
  typeAchat: TypeAchat;
  neuf?: boolean;
  /**
   * Quotité de financement, en ratio (0.90 pour 90 %). À défaut, la quotité usuelle
   * du type d'achat est utilisée : ~90 % en habitation propre, ~80 % en locatif.
   */
  quotite?: number;
};

export type CashNecessaireResult = {
  /** Cash total à sortir le jour de l'acte. */
  cashTotalCents: number;
  droitsCents: number;
  /** Honoraires hors TVA — la TVA a sa propre ligne. */
  honorairesCents: number;
  /** Frais d'acte hors honoraires : annexes, administratifs, débours, etc. */
  fraisActeCents: number;
  tvaCents: number;
  /** Total des frais d'acte d'achat — directement comparable à notaire.be. */
  fraisActeAchatCents: number;
  acteCreditCents: number;
  fraisDossierCents: number;
  apportCents: number;
  montantEmprunteCents: number;
  quotiteAppliquee: number;
  baremeNotaire: 'J' | 'Jbis';
};

/**
 * Cash nécessaire à l'acte (doc 07 § 3).
 *
 * ```
 * cash = droits d'enregistrement (ou TVA)
 *      + honoraires du notaire
 *      + frais et débours administratifs
 *      + acte de crédit (droit d'hypothèque + honoraires + inscription)
 *      + apport propre exigé par la banque
 * ```
 * C'est le chiffre que personne ne donne correctement, et celui qui décide si un
 * projet est possible cette année ou dans deux ans.
 */
export function calculerCashNecessaire(
  input: CashNecessaireInput,
  params: TaxParamSet,
): CalcResult<CashNecessaireResult> {
  const prix = Math.max(0, input.prixCents);

  const quotiteDefaut =
    input.typeAchat === 'locatif'
      ? getRate(params, 'credit.quotite.locatif')
      : getRate(params, 'credit.quotite.propre');
  const quotite = Math.min(1, Math.max(0, input.quotite ?? quotiteDefaut));
  const pQuotite = getParam(
    params,
    input.typeAchat === 'locatif' ? 'credit.quotite.locatif' : 'credit.quotite.propre',
  );

  const droits = calculerDroitsEnregistrement(input, params);
  const notaire = calculerHonorairesNotaire(
    { prixCents: prix, typeAchat: input.typeAchat },
    params,
  );

  // Postes de l'acte d'achat, tels que le notaire les facture.
  const pAnnexes = getParam(params, 'notaire.droit_annexes');
  const pAdmin = getParam(params, 'notaire.frais_administratifs');
  const pDebours = getParam(params, 'notaire.debours');
  const pTranscription = getParam(params, 'notaire.transcription_hypothecaire');
  const pEcriture = getParam(params, 'notaire.droit_ecriture');

  const annexesCents = getCents(params, 'notaire.droit_annexes');
  const adminCents = getCents(params, 'notaire.frais_administratifs');
  const deboursCents = getCents(params, 'notaire.debours');
  const transcriptionCents = getCents(params, 'notaire.transcription_hypothecaire');
  const ecritureCents = getCents(params, 'notaire.droit_ecriture');

  const fraisActeCents =
    annexesCents + adminCents + deboursCents + transcriptionCents + ecritureCents;

  // La TVA ne frappe pas tout : ni les droits d'enregistrement, ni la
  // transcription hypothécaire, ni le droit pour les annexes. Formule déduite
  // du calculateur de notaire.be et vérifiée au centime sur deux simulations.
  const tauxTva = getRate(params, 'notaire.tva_honoraires');
  const baseTvaCents =
    notaire.result.honorairesHTVACents + adminCents + deboursCents + ecritureCents;
  const tvaCents = Math.round(baseTvaCents * tauxTva);

  const fraisActeAchatCents =
    droits.result.montantCents + notaire.result.honorairesHTVACents + fraisActeCents + tvaCents;

  const montantEmprunteCents = Math.round(prix * quotite);

  const pHypotheque = getParam(params, 'credit.droit_hypotheque');
  const tauxHypotheque = getRate(params, 'credit.droit_hypotheque');
  const droitHypothequeCents = Math.round(montantEmprunteCents * tauxHypotheque);

  const pActeCredit = getParam(params, 'credit.frais_acte_forfait');
  const fraisActeCreditCents = getCents(params, 'credit.frais_acte_forfait');
  const acteCreditCents = droitHypothequeCents + fraisActeCreditCents;

  const pDossier = getParam(params, 'credit.frais_dossier');
  const fraisDossierCents = getCents(params, 'credit.frais_dossier');

  const apportCents = prix - montantEmprunteCents;

  const cashTotalCents = fraisActeAchatCents + acteCreditCents + fraisDossierCents + apportCents;

  return {
    result: {
      cashTotalCents,
      droitsCents: droits.result.montantCents,
      honorairesCents: notaire.result.honorairesHTVACents,
      fraisActeCents,
      tvaCents,
      fraisActeAchatCents,
      acteCreditCents,
      fraisDossierCents,
      apportCents,
      montantEmprunteCents,
      quotiteAppliquee: quotite,
      baremeNotaire: notaire.result.bareme,
    },
    breakdown: [
      { libelle: 'Prix d\u2019achat', valeur: prix, unite: 'eur' },
      {
        libelle: droits.result.regime === 'tva' ? 'TVA sur bien neuf' : 'Droits d\u2019enregistrement',
        valeur: droits.result.montantCents,
        unite: 'eur',
        precision: `${formatTaux(droits.result.tauxApplique * 100)} \u2014 ${LIBELLE_TYPE_ACHAT[input.typeAchat]}, ${LIBELLE_REGION[input.region]}`,
      },
      {
        libelle: 'Honoraires du notaire',
        valeur: notaire.result.honorairesHTVACents,
        unite: 'eur',
        precision:
          notaire.result.bareme === 'Jbis'
            ? 'Bar\u00e8me l\u00e9gal r\u00e9duit, r\u00e9serv\u00e9 \u00e0 l\u2019habitation propre et unique'
            : 'Bar\u00e8me l\u00e9gal d\u00e9gressif',
      },
      { libelle: 'Frais administratifs', valeur: adminCents, unite: 'eur' },
      {
        libelle: 'D\u00e9bours',
        valeur: deboursCents,
        unite: 'eur',
        precision: 'Recherches et formalit\u00e9s avanc\u00e9es par le notaire',
      },
      { libelle: 'Transcription hypoth\u00e9caire', valeur: transcriptionCents, unite: 'eur' },
      { libelle: 'Droit pour les annexes', valeur: annexesCents, unite: 'eur' },
      { libelle: 'Droit d\u2019\u00e9criture', valeur: ecritureCents, unite: 'eur' },
      {
        libelle: 'TVA',
        valeur: tvaCents,
        unite: 'eur',
        precision:
          'Sur les honoraires, les frais administratifs, les d\u00e9bours et le droit d\u2019\u00e9criture',
      },
      {
        libelle: 'Total des frais d\u2019acte d\u2019achat',
        valeur: fraisActeAchatCents,
        unite: 'eur',
        total: true,
      },
      {
        libelle: 'Acte de cr\u00e9dit',
        valeur: acteCreditCents,
        unite: 'eur',
        precision: `Droit d'hypoth\u00e8que de ${formatTaux(pHypotheque.valeur, 0)} sur ${formatEUR(montantEmprunteCents, { decimals: 0 })}, honoraires et inscription`,
      },
      { libelle: 'Frais de dossier bancaire', valeur: fraisDossierCents, unite: 'eur' },
      {
        libelle: 'Apport propre',
        valeur: apportCents,
        unite: 'eur',
        precision: `La banque finance ${formatTaux(quotite * 100, 0)} du prix, le reste est \u00e0 ta charge`,
      },
      { libelle: 'Cash n\u00e9cessaire \u00e0 l\u2019acte', valeur: cashTotalCents, unite: 'eur', total: true },
      { libelle: 'Montant emprunt\u00e9', valeur: montantEmprunteCents, unite: 'eur' },
    ],
    sources: mergeSources(droits.sources, notaire.sources, [
      toSource(pAnnexes),
      toSource(pAdmin),
      toSource(pDebours),
      toSource(pTranscription),
      toSource(pEcriture),
      toSource(pHypotheque),
      toSource(pActeCredit),
      toSource(pDossier),
      toSource(pQuotite),
    ]),
    hypotheses: [
      ...droits.hypotheses,
      ...notaire.hypotheses,
      'La quotit\u00e9 de financement est une pratique de march\u00e9 encadr\u00e9e par la BNB, pas une r\u00e8gle absolue : elle se n\u00e9gocie selon le dossier.',
      'Les frais de l\u2019acte de cr\u00e9dit et le droit d\u2019hypoth\u00e8que restent des ordres de grandeur : ta banque et ton notaire donnent le chiffre exact.',
    ],
  };
}

export type OrdreAchatInput = {
  /** Prix du bien locatif envisagé maintenant, en centimes. */
  prixLocatifEnvisageCents: number;
  /** Prix de la future résidence principale, en centimes. */
  prixResidencePrincipaleFutureCents: number;
  region: RegionFiscale;
};

export type OrdreAchatResult = {
  /** Surcoût de droits causé par l'ordre d'achat choisi. */
  surcoutDroitsCents: number;
  /** Droits sur la future RP si elle est achetée en premier (taux réduit). */
  droitsRPTauxReduitCents: number;
  /** Droits sur la future RP si le locatif a été acheté avant (taux plein). */
  droitsRPTauxPleinCents: number;
  explication: string;
};

/**
 * Arbitrage « locatif d'abord ou résidence principale d'abord » — la fonction
 * signature du produit (doc 07 § 3).
 *
 * Acheter un bien locatif avant sa résidence principale fait perdre le bénéfice du
 * taux réduit sur l'achat suivant, puisque la condition d'absence d'un autre immeuble
 * d'habitation n'est plus remplie. On chiffre l'écart, on ne dit pas quoi faire.
 */
export function coutOrdreAchat(
  input: OrdreAchatInput,
  params: TaxParamSet,
): CalcResult<OrdreAchatResult> {
  const prixRP = Math.max(0, input.prixResidencePrincipaleFutureCents);

  const avecTauxReduit = calculerDroitsEnregistrement(
    { prixCents: prixRP, region: input.region, typeAchat: 'propre_unique' },
    params,
  );
  const avecTauxPlein = calculerDroitsEnregistrement(
    { prixCents: prixRP, region: input.region, typeAchat: 'autre' },
    params,
  );

  const droitsRPTauxReduitCents = avecTauxReduit.result.montantCents;
  const droitsRPTauxPleinCents = avecTauxPlein.result.montantCents;
  const surcoutDroitsCents = Math.max(0, droitsRPTauxPleinCents - droitsRPTauxReduitCents);

  const explication =
    surcoutDroitsCents > 0
      ? `Acheter le locatif d'abord fait perdre le taux réduit sur ta future résidence principale : ` +
        `${formatEUR(droitsRPTauxPleinCents, { decimals: 0 })} de droits au lieu de ${formatEUR(droitsRPTauxReduitCents, { decimals: 0 })}, ` +
        `soit ${formatEUR(surcoutDroitsCents, { decimals: 0 })} de plus. ` +
        `Ce montant est à mettre en face du rendement attendu du locatif sur la période.`
      : `En ${LIBELLE_REGION[input.region]}, le taux appliqué à une habitation propre et unique ne diffère pas du taux plein : ` +
        `l'ordre d'achat ne change pas les droits d'enregistrement.`;

  return {
    result: {
      surcoutDroitsCents,
      droitsRPTauxReduitCents,
      droitsRPTauxPleinCents,
      explication,
    },
    breakdown: [
      {
        libelle: 'Prix de la future résidence principale',
        valeur: prixRP,
        unite: 'eur',
      },
      {
        libelle: 'Droits si tu achètes la RP en premier',
        valeur: droitsRPTauxReduitCents,
        unite: 'eur',
        precision: `Taux réduit — ${formatTaux(avecTauxReduit.result.tauxApplique * 100)}`,
      },
      {
        libelle: 'Droits si le locatif a été acheté avant',
        valeur: droitsRPTauxPleinCents,
        unite: 'eur',
        precision: `Taux plein — ${formatTaux(avecTauxPlein.result.tauxApplique * 100)}`,
      },
      {
        libelle: 'Surcoût de l’ordre d’achat',
        valeur: surcoutDroitsCents,
        unite: 'eur',
        precision: explication,
        total: true,
      },
      {
        libelle: 'Prix du locatif envisagé',
        valeur: Math.max(0, input.prixLocatifEnvisageCents),
        unite: 'eur',
        precision: 'Pour mémoire — le surcoût porte sur l’achat suivant, pas sur celui-ci',
      },
    ],
    sources: mergeSources(avecTauxReduit.sources, avecTauxPlein.sources),
    hypotheses: [
      ...avecTauxReduit.hypotheses,
      'Le calcul suppose que le bien locatif est détenu en pleine propriété au moment de l’achat de la résidence principale.',
      'Nestor chiffre l’écart, il ne recommande pas un ordre d’achat : la décision dépend du rendement du locatif, de ton horizon et de ta situation.',
    ],
  };
}
