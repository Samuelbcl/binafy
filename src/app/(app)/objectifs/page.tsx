import type { Metadata } from 'next';
import Link from 'next/link';
import { CarteKPI } from '@/components/ui/carte-kpi';
import { Montant } from '@/components/ui/montant';
import { PanneauExplication } from '@/components/ui/panneau-explication';
import {
  ACTIFS_DEMO,
  budgetDemo,
  CATEGORIES_DEMO,
} from '@/lib/demo/donnees';
import { calculerEpargnePrecaution, calculerTauxEpargneCompare } from '@/lib/finance/epargne';
import { calculerCashNecessaire } from '@/lib/tax/enregistrement';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import { euros, formatPercent } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Objectifs',
  description: 'Transformer une intention floue en date.',
};

/**
 * Module objectifs (doc 02 § module 5).
 *
 * Les deux objectifs spéciaux se **calculent**, ils ne se déclarent pas :
 * l'épargne de précaution depuis les charges fixes constatées, l'apport immobilier
 * depuis le module frais d'acquisition. Et la date d'atteinte est projetée au
 * rythme d'épargne réel des derniers mois, pas au rythme déclaré.
 */
export default function ObjectifsPage() {
  const budget = calculerTauxEpargneCompare(budgetDemo());
  const capaciteMensuelle = Math.round(
    budget.result.lisse12Mois.nonDepenseCents / (budget.result.lisse12Mois.moisComptes || 1),
  );

  // Charges fixes détectées : logement, transport, abonnements.
  const chargesFixes = CATEGORIES_DEMO.filter((c) =>
    ['Logement', 'Transport', 'Abonnements'].includes(c.nom),
  ).reduce((s, c) => s + c.montantCents, 0);

  const epargneLiquide = ACTIFS_DEMO.filter((a) =>
    ['compte_epargne', 'compte_courant'].includes(a.classe),
  ).reduce((s, a) => s + a.valeurCents, 0);

  const precaution = calculerEpargnePrecaution({
    chargesFixesMensuellesCents: chargesFixes,
    moisDeCouverture: 4,
    dejaEpargneCents: epargneLiquide,
    capaciteEpargneMensuelleCents: capaciteMensuelle,
  });

  // Apport immobilier : la cible vient du moteur de frais d'acquisition, donc elle est juste.
  const acquisition = calculerCashNecessaire(
    { prixCents: euros(280_000), region: 'wallonie', typeAchat: 'propre_unique' },
    TAX_PARAMS_2026,
  );
  const apport = calculerEpargnePrecaution({
    chargesFixesMensuellesCents: Math.round(acquisition.result.cashTotalCents / 4),
    moisDeCouverture: 4,
    dejaEpargneCents: epargneLiquide,
    capaciteEpargneMensuelleCents: capaciteMensuelle,
  });

  const objectifs = [
    {
      id: 'precaution',
      nom: 'Épargne de précaution',
      sousTitre: `4 mois de charges fixes, calculés sur ton budget réel`,
      calcul: precaution,
      cible: precaution.result.cibleCents,
      atteint: epargneLiquide,
    },
    {
      id: 'apport',
      nom: 'Apport pour un achat à 280 000 €',
      sousTitre: 'Cible issue du calculateur de frais d’acquisition, en Wallonie',
      calcul: apport,
      cible: acquisition.result.cashTotalCents,
      atteint: epargneLiquide,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight">Objectifs</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-text-muted">
          Transformer une intention floue en date. La progression est projetée au rythme
          d’épargne réellement constaté sur les douze derniers mois, pas au rythme déclaré.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <CarteKPI
          label="Capacité d’épargne constatée"
          valeurCents={capaciteMensuelle}
          precision={`Moyenne réelle sur 12 mois, soit ${formatPercent(
            budget.result.lisse12Mois.tauxEpargne,
          )} de tes revenus`}
        />
        <CarteKPI
          label="Épargne liquide disponible"
          valeurCents={epargneLiquide}
          precision="Comptes courant et épargne"
        />
      </div>

      {objectifs.map((objectif) => {
        const progression = objectif.cible > 0
          ? Math.min(1, objectif.atteint / objectif.cible)
          : 0;
        const reste = Math.max(0, objectif.cible - objectif.atteint);
        const mois = capaciteMensuelle > 0 ? Math.ceil(reste / capaciteMensuelle) : null;

        return (
          <section key={objectif.id} className="carte p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[17px] font-semibold">{objectif.nom}</h2>
              <span className="font-mono text-[13px] tabular-nums text-text-muted">
                {formatPercent(progression)}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-text-subtle">{objectif.sousTitre}</p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${Math.max(1, progression * 100)}%` }}
              />
            </div>

            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="label-kpi">Atteint</dt>
                <dd className="mt-1">
                  <Montant cents={objectif.atteint} decimals={0} />
                </dd>
              </div>
              <div>
                <dt className="label-kpi">Cible</dt>
                <dd className="mt-1">
                  <Montant cents={objectif.cible} decimals={0} />
                </dd>
              </div>
              <div>
                <dt className="label-kpi">Échéance projetée</dt>
                <dd className="mt-1 font-mono text-[15px] tabular-nums">
                  {reste === 0
                    ? 'Atteint'
                    : mois === null
                      ? '—'
                      : `${mois} mois`}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <PanneauExplication calcul={objectif.calcul} titre="Comment la cible est calculée" />
            </div>
          </section>
        );
      })}

      <p className="text-[12px] leading-relaxed text-text-subtle">
        La création d’objectifs libres arrive avec la persistance en base. Voir{' '}
        <Link href="/projections" className="text-text-muted underline underline-offset-2">
          les projections
        </Link>{' '}
        pour ajuster les hypothèses.
      </p>
    </div>
  );
}
