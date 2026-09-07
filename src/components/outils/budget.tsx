'use client';

import { useMemo } from 'react';
import { ChampNombre } from '@/components/ui/champs';
import { Montant } from '@/components/ui/montant';
import { MentionInformative, PanneauExplication } from '@/components/ui/panneau-explication';
import { useEtatUrl } from '@/lib/use-etat-url';
import { euros, formatPercent } from '@/lib/money';
import { calculerEpargnePrecaution, calculerTauxEpargne } from '@/lib/finance/epargne';

/**
 * Taux d'épargne et épargne de précaution (doc 07 § 5).
 *
 * La distinction qui fait tout le calculateur : **ce qui n'est pas dépensé** et
 * **ce qui est investi** ne sont pas la même chose. Quelqu'un qui met 500 € par
 * mois sur un compte d'épargne à 0,90 % a un excellent taux d'épargne et un taux
 * d'investissement nul. Les deux chiffres racontent des histoires différentes.
 *
 * `?revenus=2400&depenses=1800&investi=200&charges_fixes=1100&couverture=4&deja=3000`
 */

export type ValeursBudget = {
  revenus: number;
  depenses: number;
  investi: number;
  charges_fixes: number;
  couverture: number;
  deja: number;
};

export function OutilBudget({ initiales }: { initiales: ValeursBudget }) {
  const [v, definir] = useEtatUrl(initiales);

  // Un mois type, répété : le calculateur travaille sur des séries de mois.
  const calcul = useMemo(
    () =>
      calculerTauxEpargne([
        {
          mois: '2026-01',
          revenusCents: euros(v.revenus),
          depensesCents: euros(v.depenses),
          investiCents: euros(v.investi),
        },
      ]),
    [v.revenus, v.depenses, v.investi],
  );

  const { result } = calcul;

  const precaution = useMemo(
    () =>
      calculerEpargnePrecaution({
        chargesFixesMensuellesCents: euros(v.charges_fixes),
        moisDeCouverture: v.couverture,
        dejaEpargneCents: euros(v.deja),
        capaciteEpargneMensuelleCents: Math.max(0, result.nonDepenseCents),
      }),
    [v.charges_fixes, v.couverture, v.deja, result.nonDepenseCents],
  );

  const revenus = Math.max(1, result.revenusCents);
  const partDepenses = Math.min(1, result.depensesCents / revenus);
  const partInvesti = Math.min(1, Math.max(0, result.investiCents) / revenus);
  const partLiquide = Math.max(0, 1 - partDepenses - partInvesti);

  const deficit = result.nonDepenseCents < 0;

  return (
    <div className="space-y-6">
      <section className="carte p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <ChampNombre
            label="Revenus"
            valeur={v.revenus}
            onChange={(x) => definir('revenus', x)}
            suffixe="€/mois"
            pas={100}
            aide="Net sur le compte, hors pécule et prime."
          />
          <ChampNombre
            label="Dépenses"
            valeur={v.depenses}
            onChange={(x) => definir('depenses', x)}
            suffixe="€/mois"
            pas={50}
            aide="Tout ce qui sort et ne revient pas."
          />
          <ChampNombre
            label="Dont investi"
            valeur={v.investi}
            onChange={(x) => definir('investi', x)}
            suffixe="€/mois"
            pas={25}
            aide="Vers des actifs de rendement, pas un compte d’épargne."
          />
        </div>
      </section>

      <section className="rounded-[var(--radius-xl)] bg-primary p-6 text-on-primary sm:p-8">
        <p className="text-[13px] opacity-75">Taux d’épargne</p>
        <p className="chiffre-hero mt-2 tabular-nums">{formatPercent(result.tauxEpargne)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="puce bg-on-primary/15 tabular-nums">
            {formatPercent(result.tauxInvestissement)} investi
          </span>
          <span className="puce bg-on-primary/15 tabular-nums">
            <Montant
              cents={result.nonDepenseCents}
              decimals={0}
              className="font-bold text-on-primary"
            />
            {' '}mis de côté chaque mois
          </span>
        </div>

        {/* Trois parts d'un même revenu, à l'échelle. */}
        <div className="mt-6 flex h-2.5 gap-1 overflow-hidden rounded-full bg-on-primary/20">
          <div style={{ width: `${partDepenses * 100}%` }} className="rounded-full bg-on-primary/45" />
          <div style={{ width: `${partLiquide * 100}%` }} className="rounded-full bg-on-primary/75" />
          <div style={{ width: `${partInvesti * 100}%` }} className="rounded-full bg-on-primary" />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] opacity-90">
          <span>Dépensé {formatPercent(partDepenses)}</span>
          <span>Épargné sans être investi {formatPercent(partLiquide)}</span>
          <span>Investi {formatPercent(partInvesti)}</span>
        </div>
      </section>

      {deficit && (
        <section className="carte p-5">
          <h2 className="text-[15px] font-bold">Les dépenses dépassent les revenus</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-muted">
            Le taux d’épargne est négatif : le budget se creuse de{' '}
            <Montant cents={-result.nonDepenseCents} decimals={0} className="font-semibold" /> par
            mois. Tant que ce chiffre ne repasse pas au-dessus de zéro, le reste — placements,
            fiscalité, projections — n’a pas d’effet.
          </p>
        </section>
      )}

      <PanneauExplication calcul={calcul} />

      <section className="carte p-5 sm:p-6">
        <h2 className="text-[16px] font-bold">Épargne de précaution</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-muted">
          La cible se calcule, elle ne se décide pas : c’est le nombre de mois de charges fixes que
          tu veux pouvoir absorber sans revenu.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <ChampNombre
            label="Charges fixes"
            valeur={v.charges_fixes}
            onChange={(x) => definir('charges_fixes', x)}
            suffixe="€/mois"
            pas={50}
            aide="Loyer, énergie, assurances, abonnements."
          />
          <ChampNombre
            label="Mois de couverture"
            valeur={v.couverture}
            onChange={(x) => definir('couverture', x)}
            suffixe="mois"
            min={1}
            max={12}
            pas={1}
          />
          <ChampNombre
            label="Déjà de côté"
            valeur={v.deja}
            onChange={(x) => definir('deja', x)}
            suffixe="€"
            pas={500}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="label-kpi">Cible</p>
            <p className="mt-1.5 text-[19px] font-extrabold tracking-[-0.02em] sm:text-[22px]">
              <Montant cents={precaution.result.cibleCents} decimals={0} />
            </p>
          </div>
          <div>
            <p className="label-kpi">Reste à constituer</p>
            <p className="mt-1.5 text-[19px] font-extrabold tracking-[-0.02em] sm:text-[22px]">
              <Montant cents={precaution.result.resteAConstituerCents} decimals={0} />
            </p>
          </div>
          <div>
            <p className="label-kpi">À ce rythme</p>
            <p className="mt-1.5 text-[19px] font-extrabold tabular-nums tracking-[-0.02em] sm:text-[22px]">
              {precaution.result.moisRestants === null
                ? '—'
                : precaution.result.moisRestants === 0
                  ? 'Atteinte'
                  : `${precaution.result.moisRestants} mois`}
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${precaution.result.progression * 100}%` }}
          />
        </div>

        <PanneauExplication calcul={precaution} className="mt-5" />
      </section>

      <MentionInformative />
    </div>
  );
}
