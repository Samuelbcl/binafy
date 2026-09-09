import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { PastilleIcone } from '@/components/ui/pastille-icone';
import { CarteKPI, CarteKPITexte } from '@/components/ui/carte-kpi';
import { Jauge } from '@/components/ui/jauge';
import { Montant } from '@/components/ui/montant';
import {
  MentionInformative,
  PanneauExplication,
} from '@/components/ui/panneau-explication';
import { chargerPatrimoine } from '@/lib/db/patrimoine';
import { PROFIL_DEMO } from '@/lib/demo/donnees';
import { valeurQuotePart } from '@/lib/patrimoine/types';
import { euros, formatEUR, formatPercent } from '@/lib/money';
import {
  calculerEpargneLongTerme,
  calculerEpargnePension,
} from '@/lib/tax/epargne-fiscale';
import { calculerIPP } from '@/lib/tax/ipp';
import { TAX_PARAMS_2026, parametresNonVerifies } from '@/lib/tax/parametres';
import { calculerImpotLatent } from '@/lib/tax/plus-values';
import { calculerPrecompteEpargneReglementee } from '@/lib/tax/precompte';
import { parametresARevoir, getCents } from '@/lib/tax/types';

export const metadata: Metadata = {
  title: 'Fiscalité',
  description: 'Ta position fiscale de l’année, ton impôt latent et tes alertes.',
};

/**
 * Module fiscalité (doc 02 § module 6).
 *
 * « C'est ce module qui justifie l'existence du produit. Il doit être le plus soigné. »
 */
export default async function FiscalitePage() {
  const params = TAX_PARAMS_2026;
  const { actifs } = await chargerPatrimoine();

  const ipp = calculerIPP(
    {
      revenuImposableCents: PROFIL_DEMO.revenuImposableAnnuelCents,
      additionnelsCommunauxPourcent: PROFIL_DEMO.additionnelsCommunauxPourcent,
    },
    params,
  );

  const impotLatent = calculerImpotLatent(
    {
      positions: actifs.map((a) => ({
        id: a.id,
        nom: a.nom,
        valeurActuelleCents: valeurQuotePart(a),
        prixAcquisitionCents: a.prixAcquisitionCents ?? null,
        valeurReference2025Cents: a.valeurReference2025Cents ?? null,
        dateAcquisition: a.dateAcquisition ?? null,
        supportTOB: a.supportTOB ?? null,
      })),
    },
    params,
  );

  const epargne = actifs.find((a) => a.classe === 'compte_epargne' && a.tauxBase != null);
  const interetsEpargne = epargne
    ? calculerPrecompteEpargneReglementee(
        {
          interetsBaseCents: Math.round(
            valeurQuotePart(epargne) * ((epargne.tauxBase ?? 0) / 100),
          ),
          primeFideliteCents: Math.round(
            valeurQuotePart(epargne) * ((epargne.primeFidelite ?? 0) / 100),
          ),
        },
        params,
      )
    : null;

  // Les deux enveloppes d'épargne fiscale, au plafond, pour montrer ce que
  // chacune rapporterait. On chiffre, on ne recommande pas.
  const pension = calculerEpargnePension({ versementCents: euros(1_050) }, params);
  const longTerme = calculerEpargneLongTerme(
    {
      revenuNetImposableCents: PROFIL_DEMO.revenuImposableAnnuelCents,
      versementCents: euros(2_450),
    },
    params,
  );

  const nonVerifies = parametresNonVerifies(params);
  const exonerationAnnuelleCents = getCents(params, 'plus_values.exoneration_annuelle');
  // La date du rendu, pas une horloge dans le calcul : les fonctions fiscales
  // restent pures, c'est la page qui sait quel jour on est.
  const aRevoirMaintenant = parametresARevoir(
    params.parametres,
    new Date().toISOString().slice(0, 10),
  );

  const alertes = [
    {
      niveau: 'info' as const,
      titre: 'Exonération sur les plus-values : entièrement disponible',
      texte: `Il te reste ${formatEUR(
        impotLatent.result.exonerationRestanteCents,
        { decimals: 0 },
      )} d’exonération annuelle. Elle ne se reporte pas d’une année à l’autre.`,
    },
    {
      niveau: 'info' as const,
      titre: 'Prime de fidélité sur ton compte d’épargne',
      texte:
        'La prime n’est acquise qu’après 12 mois de présence continue des fonds. Un retrait avant l’échéance la fait perdre sur les montants concernés.',
    },
    {
      niveau: 'attention' as const,
      titre: 'Courtier étranger : précompte non retenu',
      texte:
        'Tes positions sont chez Degiro et Bitstamp. Les dividendes et intérêts perçus via un courtier étranger ne subissent pas de précompte à la source : ils sont à déclarer toi-même.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="titre-degrade text-[30px] font-bold tracking-tight">Fiscalité</h1>
        <p className="mt-1.5 text-[14px] text-text-muted">
          Ta position pour l’année {params.annee} — {PROFIL_DEMO.commune}, additionnels
          communaux de {String(PROFIL_DEMO.additionnelsCommunauxPourcent).replace('.', ',')} %.
        </p>
      </header>

      {/* 1 — Position fiscale de l'année */}
      <section className="space-y-4 apparait" style={{ '--delai': '70ms' } as CSSProperties}>
        <div className="flex gap-3">
          <PastilleIcone icone="buildings-2" teinte="violet" className="mt-0.5 hidden sm:grid" />
          <div className="min-w-0">
            <h2 className="text-[17px] tracking-[-0.01em]">Ma position fiscale</h2>
            <p className="mt-1 hidden text-[13px] leading-relaxed text-text-muted sm:block">
              Ce que l’État prélèvera sur tes revenus de cette année, et ce qu’il te laisse.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <CarteKPITexte
            label="Taux marginal"
            valeur={formatPercent(ipp.result.tauxMarginal)}
            precision="Le taux qui frappera ton prochain euro de revenu"
            accent
          />
          <CarteKPITexte
            label="Taux moyen"
            valeur={formatPercent(ipp.result.tauxMoyen)}
            precision="Sur l’ensemble de ton revenu imposable"
          />
          <CarteKPI
            label="Impôt estimé"
            valeurCents={ipp.result.totalCents}
            precision="Fédéral et additionnels communaux"
          />
          <Jauge
            label="Exonération plus-values"
            valeurCents={
              exonerationAnnuelleCents - impotLatent.result.exonerationRestanteCents
            }
            cibleCents={exonerationAnnuelleCents}
            inverse
            precision={`Consommée cette année. Il t’en reste ${formatEUR(
              impotLatent.result.exonerationRestanteCents,
              { decimals: 0 },
            )} avant que la taxe ne s’applique.`}
            className="col-span-2 lg:col-span-1"
          />
        </div>
        <PanneauExplication calcul={ipp} titre="D’où vient ton taux marginal" />
      </section>

      {/* 2 — Impôt latent */}
      <section className="mt-10 space-y-4 border-t border-text-subtle/25 pt-8 apparait" style={{ '--delai': '140ms' } as CSSProperties}>
        <div className="flex gap-3">
          <PastilleIcone icone="banknote" teinte="ambre" className="mt-0.5 hidden sm:grid" />
          <div className="min-w-0">
            <h2 className="text-[17px] tracking-[-0.01em]">Impôt latent</h2>
            <p className="mt-1 hidden text-[13px] leading-relaxed text-text-muted sm:block">
              L’impôt qui dort dans tes plus-values. Il ne se paie qu’à la vente — mais il existe déjà.
            </p>
          </div>
        </div>
        <div className="carte p-5 sm:p-6">
          <p className="text-[13px] leading-relaxed text-text-muted">
            Ce que tu paierais si tu liquidais tout aujourd’hui, ligne par ligne. Partout
            ailleurs, un patrimoine s’affiche brut.
          </p>

          {/* Une liste, pas une table : cinq colonnes ne tiennent pas dans 390 px,
              et une table qu'on fait defiler se lit de travers. Chaque position a
              sa ligne — le nom et sa base a gauche, la plus-value et l'impot a droite. */}
          <ul className="mt-4 divide-y divide-border/50">
            {impotLatent.result.lignes.map((ligne) => (
              <li key={ligne.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium">{ligne.nom}</p>
                  <p className="text-[12px] text-text-subtle">
                    <Montant cents={ligne.valeurActuelleCents} decimals={0} className="font-normal" />
                    {ligne.baseReferenceCents !== null ? (
                      <>
                        {' · base '}
                        <Montant cents={ligne.baseReferenceCents} decimals={0} className="font-normal" />
                        {ligne.origineBase === 'valeur_2025' && ' (31/12/2025)'}
                      </>
                    ) : (
                      ' · base à renseigner'
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Montant cents={ligne.plusValueLatenteCents} decimals={0} colore sign="always" />
                  <p className="text-[11px] text-text-subtle">plus-value</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-baseline justify-between border-t border-border pt-3 text-[14px]">
            <span className="font-semibold">Impôt latent total</span>
            <Montant cents={impotLatent.result.impotLatentCents} decimals={0} className="text-[16px]" />
          </p>
        </div>
        <PanneauExplication calcul={impotLatent} titre="Le détail du calcul" />
      </section>

      {/* 3 — Alertes */}
      <section className="mt-10 space-y-4 border-t border-text-subtle/25 pt-8 apparait" style={{ '--delai': '210ms' } as CSSProperties}>
        <div className="flex gap-3">
          <PastilleIcone icone="bell" teinte="rose" className="mt-0.5 hidden sm:grid" />
          <div className="min-w-0">
            <h2 className="text-[17px] tracking-[-0.01em]">Alertes</h2>
            <p className="mt-1 hidden text-[13px] leading-relaxed text-text-muted sm:block">
              Ce qui mérite ton attention avant la fin de l’année.
            </p>
          </div>
        </div>
        <ul className="space-y-3">
          {alertes.map((alerte) => (
            <li key={alerte.titre} className="carte flex gap-3 p-4">
              {alerte.niveau === 'attention' ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              ) : (
                <Info className="mt-0.5 size-4 shrink-0 text-info" />
              )}
              <div>
                <p className="text-[14px] font-medium">{alerte.titre}</p>
                <p className="mt-1 hidden text-[13px] leading-relaxed text-text-muted sm:block">{alerte.texte}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 4 — Revenus mobiliers */}
      {interetsEpargne && (
        <section className="mt-10 space-y-4 border-t border-text-subtle/25 pt-8 apparait" style={{ '--delai': '280ms' } as CSSProperties}>
          <div className="flex gap-3">
          <PastilleIcone icone="money-bag" teinte="menthe" className="mt-0.5 hidden sm:grid" />
          <div className="min-w-0">
            <h2 className="text-[17px] tracking-[-0.01em]">Revenus mobiliers</h2>
            <p className="mt-1 hidden text-[13px] leading-relaxed text-text-muted sm:block">
              Intérêts et dividendes encaissés, et ce que tu peux récupérer.
            </p>
          </div>
        </div>
          <PanneauExplication
            calcul={interetsEpargne}
            titre="Intérêts de ton compte d’épargne réglementé"
            ouvertParDefaut
          />
        </section>
      )}

      {/* 5 — Enveloppes d'épargne fiscale */}
      <section className="mt-10 space-y-4 border-t border-text-subtle/25 pt-8 apparait" style={{ '--delai': '350ms' } as CSSProperties}>
        <div className="flex gap-3">
          <PastilleIcone icone="safe-2" teinte="lagune" className="mt-0.5 hidden sm:grid" />
          <div className="min-w-0">
            <h2 className="text-[17px] tracking-[-0.01em]">Enveloppes d’épargne</h2>
            <p className="mt-1 hidden text-[13px] leading-relaxed text-text-muted sm:block">
              Les dispositifs qui réduisent ton impôt, et jusqu’où tu peux les remplir.
            </p>
          </div>
        </div>

        <div className="carte p-5 sm:p-6">
          <h3 className="font-display text-[17px]">Épargne-pension</h3>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-text-muted">
            Deux plafonds coexistent, et le plus élevé n’est pas mécaniquement le meilleur :
            au-delà du plafond bas, le taux réduit s’applique à la totalité du versement, pas
            au seul dépassement.
          </p>


          <div className="mt-4">
            <PanneauExplication calcul={pension} titre="Le détail du calcul" />
          </div>
        </div>

        <div className="carte p-5 sm:p-6">
          <h3 className="font-display text-[17px]">Épargne à long terme</h3>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-text-muted">
            Son plafond dépend de tes revenus et se partage avec les réductions liées à un
            crédit hypothécaire. En Wallonie, les crédits conclus depuis 2025 n’ouvrent plus
            droit à réduction pour l’habitation propre : le panier est alors entièrement
            disponible.
          </p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="label-kpi">Plafond disponible</dt>
              <dd className="mt-1.5">
                <Montant
                  cents={longTerme.result.plafondDisponibleCents}
                  decimals={0}
                  className="text-[18px]"
                />
              </dd>
            </div>
            <div>
              <dt className="label-kpi">Réduction si tu verses le maximum</dt>
              <dd className="mt-1.5">
                <Montant
                  cents={longTerme.result.reductionCents}
                  decimals={0}
                  className="text-[18px] text-primary"
                />
              </dd>
            </div>
            <div>
              <dt className="label-kpi">Taxe à 60 ans</dt>
              <dd className="mt-1.5 font-mono text-[18px] tabular-nums">10 %</dd>
            </div>
          </dl>

          <div className="mt-4">
            <PanneauExplication calcul={longTerme} titre="Le détail du calcul" />
          </div>
        </div>
      </section>

      {/* Transparence sur l'état des paramètres fiscaux */}
      <section className="carte mt-10 p-5 sm:p-6">
        <h2 className="text-[17px] tracking-[-0.01em]">État des paramètres fiscaux</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
          {params.parametres.length} paramètres chargés pour {params.annee}, dont{' '}
          <span className="font-medium text-warning">{nonVerifies.length}</span> encore à
          confirmer à la source officielle. Chaque calcul qui en dépend l’indique.
        </p>
        {/*
          Une valeur exacte le jour où on l'écrit devient fausse toute seule :
          la Belgique indexe ses montants chaque année. On affiche donc aussi ce
          qui a dépassé sa durée de validité, pas seulement ce qui n'a jamais
          été confirmé.
        */}
        <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
          {aRevoirMaintenant.length === 0 ? (
            <>Aucune valeur n’a dépassé sa durée de validité.</>
          ) : (
            <>
              <span className="font-medium text-warning">{aRevoirMaintenant.length}</span> ont
              dépassé leur durée de validité et attendent une revue.
            </>
          )}
        </p>
        <details className="mt-4">
          <summary className="cursor-pointer text-[12px] text-text-muted hover:text-text">
            Voir les paramètres à vérifier
          </summary>
          <ul className="mt-3 space-y-1.5">
            {nonVerifies.map((p) => (
              <li key={`${p.cle}-${p.region ?? 'federal'}`} className="text-[12px] text-text-subtle">
                <code className="text-text-muted">{p.cle}</code>
                {p.region && ` (${p.region})`} — {p.libelle}
              </li>
            ))}
          </ul>
        </details>
      </section>

      <MentionInformative />
    </div>
  );
}
