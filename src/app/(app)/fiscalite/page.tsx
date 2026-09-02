import type { Metadata } from 'next';
import { AlertTriangle, Info } from 'lucide-react';
import { CarteKPI, CarteKPITexte } from '@/components/ui/carte-kpi';
import { Montant } from '@/components/ui/montant';
import {
  MentionInformative,
  PanneauExplication,
} from '@/components/ui/panneau-explication';
import { ACTIFS_DEMO, PROFIL_DEMO } from '@/lib/demo/donnees';
import { formatEUR, formatPercent } from '@/lib/money';
import { calculerIPP } from '@/lib/tax/ipp';
import { TAX_PARAMS_2026, parametresNonVerifies } from '@/lib/tax/parametres';
import { calculerImpotLatent } from '@/lib/tax/plus-values';
import { calculerPrecompteEpargneReglementee } from '@/lib/tax/precompte';

export const metadata: Metadata = {
  title: 'Fiscalité',
  description: 'Ta position fiscale de l’année, ton impôt latent et tes alertes.',
};

/**
 * Module fiscalité (doc 02 § module 6).
 *
 * « C'est ce module qui justifie l'existence du produit. Il doit être le plus soigné. »
 */
export default function FiscalitePage() {
  const params = TAX_PARAMS_2026;

  const ipp = calculerIPP(
    {
      revenuImposableCents: PROFIL_DEMO.revenuImposableAnnuelCents,
      additionnelsCommunauxPourcent: PROFIL_DEMO.additionnelsCommunauxPourcent,
    },
    params,
  );

  const impotLatent = calculerImpotLatent(
    {
      positions: ACTIFS_DEMO.map((a) => ({
        id: a.id,
        nom: a.nom,
        valeurActuelleCents: Math.round(a.valeurCents * (a.quotePart / 100)),
        prixAcquisitionCents: a.prixAcquisitionCents ?? null,
        valeurReference2025Cents: a.valeurReference2025Cents ?? null,
        dateAcquisition: a.dateAcquisition ?? null,
        supportTOB: a.supportTOB ?? null,
      })),
    },
    params,
  );

  const epargne = ACTIFS_DEMO.find((a) => a.classe === 'compte_epargne');
  const interetsEpargne = epargne
    ? calculerPrecompteEpargneReglementee(
        {
          interetsBaseCents: Math.round(epargne.valeurCents * ((epargne.tauxBase ?? 0) / 100)),
          primeFideliteCents: Math.round(
            epargne.valeurCents * ((epargne.primeFidelite ?? 0) / 100),
          ),
        },
        params,
      )
    : null;

  const nonVerifies = parametresNonVerifies(params);

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
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight">Fiscalité</h1>
        <p className="mt-1.5 text-[14px] text-text-muted">
          Ta position pour l’année {params.annee} — {PROFIL_DEMO.commune}, additionnels
          communaux de {PROFIL_DEMO.additionnelsCommunauxPourcent} %.
        </p>
      </header>

      {/* 1 — Position fiscale de l'année */}
      <section className="space-y-4">
        <h2 className="label-kpi">Ma position fiscale</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <CarteKPI
            label="Exonération plus-values restante"
            valeurCents={impotLatent.result.exonerationRestanteCents}
            precision="Par personne et par an, non reportable"
          />
        </div>
        <PanneauExplication calcul={ipp} titre="D’où vient ton taux marginal" />
      </section>

      {/* 2 — Impôt latent */}
      <section className="space-y-4">
        <h2 className="label-kpi">Impôt latent</h2>
        <div className="carte p-5 sm:p-6">
          <p className="text-[13px] leading-relaxed text-text-muted">
            Ce que tu paierais si tu liquidais tout aujourd’hui, ligne par ligne. Partout
            ailleurs, un patrimoine s’affiche brut.
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-[14px]">
              <caption className="sr-only">Impôt latent par position</caption>
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-text-muted">
                  <th scope="col" className="py-2 font-medium">Position</th>
                  <th scope="col" className="py-2 text-right font-medium">Valeur</th>
                  <th scope="col" className="py-2 text-right font-medium">Base de référence</th>
                  <th scope="col" className="py-2 text-right font-medium">Plus-value latente</th>
                  <th scope="col" className="py-2 text-right font-medium">TOB de sortie</th>
                </tr>
              </thead>
              <tbody>
                {impotLatent.result.lignes.map((ligne) => (
                  <tr key={ligne.id} className="border-b border-border/40 last:border-0">
                    <td className="py-2.5">
                      {ligne.nom}
                      {ligne.origineBase === 'valeur_2025' && (
                        <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-text-subtle">
                          base 31/12/2025
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <Montant cents={ligne.valeurActuelleCents} decimals={0} />
                    </td>
                    <td className="py-2.5 text-right text-text-muted">
                      {ligne.baseReferenceCents !== null ? (
                        <Montant cents={ligne.baseReferenceCents} decimals={0} />
                      ) : (
                        <span className="text-[12px]">à renseigner</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <Montant cents={ligne.plusValueLatenteCents} decimals={0} colore />
                    </td>
                    <td className="py-2.5 text-right text-text-muted">
                      <Montant cents={ligne.tobSortieCents} decimals={2} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-medium">
                  <td className="py-3">Impôt latent total</td>
                  <td colSpan={3} />
                  <td className="py-3 text-right">
                    <Montant cents={impotLatent.result.impotLatentCents} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <PanneauExplication calcul={impotLatent} titre="Le détail du calcul" />
      </section>

      {/* 3 — Alertes */}
      <section className="space-y-4">
        <h2 className="label-kpi">Alertes</h2>
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
                <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{alerte.texte}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 4 — Revenus mobiliers */}
      {interetsEpargne && (
        <section className="space-y-4">
          <h2 className="label-kpi">Revenus mobiliers</h2>
          <PanneauExplication
            calcul={interetsEpargne}
            titre="Intérêts de ton compte d’épargne réglementé"
            ouvertParDefaut
          />
        </section>
      )}

      {/* Transparence sur l'état des paramètres fiscaux */}
      <section className="carte p-5 sm:p-6">
        <h2 className="font-display text-[17px] font-semibold">État des paramètres fiscaux</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
          {params.parametres.length} paramètres chargés pour {params.annee}, dont{' '}
          <span className="font-medium text-warning">{nonVerifies.length}</span> encore à
          confirmer à la source officielle. Chaque calcul qui en dépend l’indique.
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
