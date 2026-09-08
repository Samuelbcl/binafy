'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { Montant } from '@/components/ui/montant';
import { formatEUR } from '@/lib/money';
import { calculerEpargnePension } from '@/lib/tax/epargne-fiscale';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import { getCents } from '@/lib/tax/types';

/**
 * Le piège des deux plafonds, en le manipulant.
 *
 * Ce piège ne se comprend pas en le lisant. Écrit noir sur blanc — « au-delà
 * du plafond bas, le taux réduit s'applique à la totalité du versement » —, il
 * reste abstrait ; on hoche la tête et on l'oublie. Déplacé au curseur, il
 * devient impossible à ignorer : le montant versé monte, et la réduction
 * **descend**. Personne n'oublie ce qu'il a vu bouger.
 *
 * La courbe fait le reste du travail. Elle monte, tombe d'un coup au passage du
 * plafond bas, puis remonte sans jamais rattraper grand-chose. La forme dit
 * tout avant qu'on ait lu un chiffre.
 *
 * Aucune recommandation : on montre ce que chaque montant rapporte, on nomme la
 * zone perdante, et le choix reste à qui verse.
 */
export function SimulateurEpargnePension() {
  const plafondBasCents = getCents(TAX_PARAMS_2026, 'epargne_pension.plafond_bas');
  const plafondHautCents = getCents(TAX_PARAMS_2026, 'epargne_pension.plafond_haut');

  const [versementCents, setVersementCents] = useState(plafondBasCents);

  const calcul = useMemo(
    () => calculerEpargnePension({ versementCents }, TAX_PARAMS_2026),
    [versementCents],
  );

  const reductionAuPlafondBas = calcul.result.comparaison.plafondBas.reductionCents;

  /**
   * Le point de bascule : le montant à partir duquel le plafond haut rend
   * enfin autant que le bas. Déduit des paramètres, jamais écrit en dur — si
   * un taux change, il suit.
   */
  const pointBascule = useMemo(() => {
    const tauxHaut =
      calcul.result.comparaison.plafondHaut.reductionCents /
      calcul.result.comparaison.plafondHaut.versementCents;
    return Math.ceil(reductionAuPlafondBas / tauxHaut);
  }, [calcul, reductionAuPlafondBas]);

  /** Un point tous les 10 € : assez fin pour que la chute se voie nette. */
  const courbe = useMemo(() => {
    const points: { verse: number; reduction: number }[] = [];
    for (let c = 0; c <= plafondHautCents; c += 1_000) {
      points.push({
        verse: c / 100,
        reduction: calculerEpargnePension({ versementCents: c }, TAX_PARAMS_2026).result
          .reductionCents / 100,
      });
    }
    return points;
  }, [plafondHautCents]);

  const ecart = calcul.result.reductionCents - reductionAuPlafondBas;
  const zonePerdante = versementCents > plafondBasCents && ecart < 0;

  return (
    <div className="carte p-5 sm:p-6">
      <h3 className="text-[15px] font-bold">Essaie toi-même</h3>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-text-muted">
        Fais glisser le montant que tu envisages de verser cette année, et regarde la
        réduction d’impôt.
      </p>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-kpi">Tu verses</p>
          <p className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">
            <Montant cents={versementCents} decimals={0} jamaisMasque />
          </p>
        </div>
        <div className="text-right">
          <p className="label-kpi">L’État te rend</p>
          <p className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-primary">
            <Montant cents={calcul.result.reductionCents} decimals={0} jamaisMasque />
          </p>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Montant versé sur l’épargne-pension</span>
        <input
          type="range"
          min={0}
          max={plafondHautCents}
          step={1_000}
          value={versementCents}
          style={{ '--part': `${(versementCents / plafondHautCents) * 100}%` } as CSSProperties}
          onChange={(e) => setVersementCents(Number(e.target.value))}
          className="w-full"
        />
      </label>

      <div className="flex justify-between text-[11.5px] text-text-subtle">
        <span>0 €</span>
        <span>Plafond bas {formatEUR(plafondBasCents, { decimals: 0 })}</span>
        <span>{formatEUR(plafondHautCents, { decimals: 0 })}</span>
      </div>

      {/*
        La courbe de ce que rapporte chaque montant. Sa chute au passage du
        plafond bas est l'argument : elle se voit avant d'être lue.
      */}
      <div className="mt-5 h-40" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={courbe} margin={{ top: 8, right: 28, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="verse"
              type="number"
              domain={[0, plafondHautCents / 100]}
              // Trois repères qui nomment la structure — zéro, le plafond bas,
              // le plafond haut — plutôt que des paliers choisis au hasard.
              ticks={[0, plafondBasCents / 100, plafondHautCents / 100]}
              interval={0}
              tick={{ fill: 'var(--text-subtle)', fontSize: 11 }}
              tickFormatter={(v: number) => formatEUR(v * 100, { decimals: 0 })}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-subtle)', fontSize: 11 }}
              tickFormatter={(v: number) => formatEUR(v * 100, { decimals: 0 })}
              axisLine={false}
              tickLine={false}
              width={58}
              tickCount={4}
            />
            <ReferenceLine
              x={plafondBasCents / 100}
              stroke="var(--text-subtle)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
            <Line
              type="linear"
              dataKey="reduction"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceDot
              x={versementCents / 100}
              y={calcul.result.reductionCents / 100}
              r={5}
              fill="var(--primary)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p
        className="mt-3 text-[13px] leading-relaxed"
        aria-live="polite"
      >
        {versementCents <= plafondBasCents ? (
          <span className="text-text-muted">
            Sous le plafond bas, chaque euro versé donne le taux le plus élevé.
          </span>
        ) : zonePerdante ? (
          <span className="text-warning">
            Zone perdante. Tu verses{' '}
            <Montant
              cents={versementCents - plafondBasCents}
              decimals={0}
              jamaisMasque
              className="font-semibold"
            />{' '}
            de plus qu’au plafond bas, et tu reçois{' '}
            <Montant cents={-ecart} decimals={0} jamaisMasque className="font-semibold" /> de
            moins. Il faut atteindre{' '}
            <Montant cents={pointBascule} decimals={0} jamaisMasque className="font-semibold" />{' '}
            pour seulement revenir à égalité.
          </span>
        ) : (
          <span className="text-text-muted">
            Au-dessus du point de bascule. Ces{' '}
            <Montant
              cents={versementCents - plafondBasCents}
              decimals={0}
              jamaisMasque
              className="font-semibold"
            />{' '}
            supplémentaires te rapportent{' '}
            <Montant cents={ecart} decimals={0} jamaisMasque className="font-semibold" /> de
            plus qu’au plafond bas.
          </span>
        )}
      </p>

      <p className="mt-3 text-[12px] leading-relaxed text-text-subtle">
        Nestor calcule, il ne conseille pas : le montant versé dépend de ta trésorerie et de
        ton horizon, pas seulement de la réduction d’impôt.
      </p>
    </div>
  );
}
