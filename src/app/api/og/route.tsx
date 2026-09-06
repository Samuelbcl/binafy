import type { NextRequest } from 'next/server';
import { calculerInteretsComposesNets } from '@/lib/finance/interets-composes';
import { calculerRendementLocatif } from '@/lib/finance/locatif';
import { calculerProjectionPatrimoine } from '@/lib/finance/projection';
import { booleenDepuisUrl, choixDepuisUrl, nombreDepuisUrl } from '@/lib/etat-url';
import { euros, formatEUR, formatPercent } from '@/lib/money';
import { imageOG, imageOGSimple } from '@/lib/og';
import { calculerCashNecessaire, coutOrdreAchat, type TypeAchat } from '@/lib/tax/enregistrement';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import { REGIONS } from '@/lib/tax/types';

/**
 * Images de partage, calculées (doc 09 § technique SEO).
 *
 * La route ne reçoit **que des paramètres de simulation** et recalcule le
 * chiffre elle-même. Accepter un texte libre permettrait de fabriquer une carte
 * disant n'importe quoi sous la marque Nestor — une image de partage est un
 * énoncé public, elle doit refléter un vrai calcul.
 */

export const dynamic = 'force-dynamic';

/** Convertit les query params en objet, pour réutiliser les lecteurs partagés. */
function versObjet(params: URLSearchParams): Record<string, string> {
  const objet: Record<string, string> = {};
  params.forEach((valeur, cle) => {
    objet[cle] = valeur;
  });
  return objet;
}

const TYPES_ACHAT: readonly TypeAchat[] = ['propre_unique', 'autre', 'locatif'];

export function GET(request: NextRequest) {
  const p = versObjet(request.nextUrl.searchParams);
  const outil = p.outil ?? '';

  try {
    if (outil === 'frais-acquisition') {
      const prix = nombreDepuisUrl(p, 'prix', 280_000);
      const region = choixDepuisUrl(p, 'region', REGIONS, 'wallonie');
      const typeAchat = choixDepuisUrl(p, 'type', TYPES_ACHAT, 'propre_unique');

      const cash = calculerCashNecessaire(
        { prixCents: euros(prix), region, typeAchat, neuf: booleenDepuisUrl(p, 'neuf', false) },
        TAX_PARAMS_2026,
      );

      return imageOG({
        surtitre: 'Cash nécessaire à l’acte',
        valeur: formatEUR(cash.result.cashTotalCents, { decimals: 0 }),
        legende: `Pour un bien à ${formatEUR(euros(prix), { decimals: 0 })}, droits d’enregistrement, notaire, acte de crédit et apport compris.`,
        precision: `Dont ${formatEUR(cash.result.apportCents, { decimals: 0 })} d’apport propre.`,
      });
    }

    if (outil === 'arbitrage') {
      const region = choixDepuisUrl(p, 'region', REGIONS, 'wallonie');
      const prixRP = nombreDepuisUrl(p, 'rp', 280_000);

      const arbitrage = coutOrdreAchat(
        {
          prixLocatifEnvisageCents: euros(nombreDepuisUrl(p, 'prix', 180_000)),
          prixResidencePrincipaleFutureCents: euros(prixRP),
          region,
        },
        TAX_PARAMS_2026,
      );

      return imageOG({
        surtitre: 'Ce que coûte l’ordre d’achat',
        valeur: formatEUR(arbitrage.result.surcoutDroitsCents, { decimals: 0 }),
        legende: 'Acheter un locatif avant sa résidence principale fait perdre le taux réduit sur l’achat suivant.',
        precision: `Sur une résidence principale à ${formatEUR(euros(prixRP), { decimals: 0 })}.`,
      });
    }

    if (outil === 'interets-composes') {
      const calcul = calculerInteretsComposesNets(
        {
          capitalInitialCents: euros(nombreDepuisUrl(p, 'capital_initial', 10_000)),
          versementCents: euros(nombreDepuisUrl(p, 'epargne_mensuelle', 100)),
          horizonAnnees: nombreDepuisUrl(p, 'horizon', 20),
          tauxAnnuelPourcent: nombreDepuisUrl(p, 'taux', 5),
          inflationPourcent: nombreDepuisUrl(p, 'inflation', 2),
          periodicite: 'mensuelle',
        },
        TAX_PARAMS_2026,
      );

      const horizon = nombreDepuisUrl(p, 'horizon', 20);

      return imageOG({
        surtitre: `Dans ${horizon} ans, en euros d’aujourd’hui`,
        valeur: formatEUR(calcul.result.valeurFinaleNetteReelleCents, { decimals: 0 }),
        legende: 'Net de la taxe belge sur les plus-values et corrigé de l’inflation.',
        precision: `Total versé : ${formatEUR(calcul.result.totalVerseCents, { decimals: 0 })}.`,
      });
    }

    if (outil === 'simulateur-patrimoine') {
      const horizon = nombreDepuisUrl(p, 'horizon', 25);
      const calcul = calculerProjectionPatrimoine(
        {
          patrimoineActuelCents: euros(nombreDepuisUrl(p, 'patrimoine', 50_000)),
          partActionsPourcent: nombreDepuisUrl(p, 'part_actions', 60),
          investissementAnnuelCents: euros(nombreDepuisUrl(p, 'investissement', 6_000)),
          horizonAnnees: horizon,
          rendementActionsPourcent: nombreDepuisUrl(p, 'rendement_actions', 7),
          rendementAutresPourcent: nombreDepuisUrl(p, 'rendement_autres', 2),
          fiscaliteActionsPourcent: nombreDepuisUrl(p, 'fiscalite_actions', 10),
          fiscaliteAutresPourcent: nombreDepuisUrl(p, 'fiscalite_autres', 30),
          tauxRetraitPourcent: nombreDepuisUrl(p, 'taux_retrait', 4),
          inflationPourcent: nombreDepuisUrl(p, 'inflation', 2),
          depensesAnnuellesCents: euros(nombreDepuisUrl(p, 'depenses', 24_000)),
        },
        TAX_PARAMS_2026,
      );

      return imageOG({
        surtitre: `Patrimoine dans ${horizon} ans, en euros d’aujourd’hui`,
        valeur: formatEUR(calcul.result.patrimoineFinalReelCents, { decimals: 0 }),
        legende: `Soit une rente soutenable de ${formatEUR(calcul.result.renteMensuelleReelleCents, { decimals: 0 })} par mois.`,
        precision:
          calcul.result.anneeIndependance !== null
            ? `La rente couvrirait tes dépenses actuelles au bout de ${calcul.result.anneeIndependance} ans.`
            : undefined,
      });
    }

    if (outil === 'rendement-locatif') {
      const calcul = calculerRendementLocatif(
        {
          prixCents: euros(nombreDepuisUrl(p, 'prix', 200_000)),
          region: choixDepuisUrl(p, 'region', REGIONS, 'wallonie'),
          loyerMensuelCents: euros(nombreDepuisUrl(p, 'loyer', 850)),
          revenuCadastralCents: euros(nombreDepuisUrl(p, 'rc', 900)),
          tauxMarginal: nombreDepuisUrl(p, 'marginal', 50) / 100,
          chargesAnnuellesCents: euros(nombreDepuisUrl(p, 'charges', 1_200)),
          precompteImmobilierAnnuelCents: euros(nombreDepuisUrl(p, 'precompte', 800)),
          vacancePourcent: nombreDepuisUrl(p, 'vacance', 5),
          provisionTravauxAnnuelleCents: euros(nombreDepuisUrl(p, 'travaux', 1_000)),
          credit: booleenDepuisUrl(p, 'credit', true)
            ? {
                quotitePourcent: nombreDepuisUrl(p, 'quotite', 80),
                tauxAnnuelPourcent: nombreDepuisUrl(p, 'taux', 3.5),
                dureeAnnees: nombreDepuisUrl(p, 'duree', 25),
              }
            : undefined,
        },
        TAX_PARAMS_2026,
      );

      return imageOG({
        surtitre: 'Cash-flow mensuel après impôt',
        valeur: formatEUR(calcul.result.cashFlowMensuelCents, { decimals: 0, sign: 'always' }),
        legende:
          calcul.result.cashFlowMensuelCents < 0
            ? 'Ce bien coûte de l’argent chaque mois, malgré un rendement brut flatteur.'
            : 'Ce bien s’autofinance, charges, impôt et crédit déduits.',
        precision: `Rendement brut ${formatPercent(calcul.result.rendementBrut)}, net d’impôt ${formatPercent(calcul.result.rendementNetImpot)}.`,
      });
    }
  } catch {
    // Un paramètre absurde ne doit pas rendre une page impartageable : on sert
    // la carte générique plutôt qu'une erreur.
  }

  return imageOGSimple({
    titre: 'Le patrimoine, version belge',
    sousTitre:
      'Suivre, comprendre, décider. Fiscalité belge intégrée à chaque calcul — précompte, TOB, plus-values, droits d’enregistrement par Région.',
  });
}
