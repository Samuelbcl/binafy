'use client';

import { cn } from '@/lib/cn';
import { Montant, Variation } from './montant';

/**
 * Carte KPI (doc 05 § composants clés).
 * Label 12px muted uppercase, valeur en display, variation en dessous avec puce.
 */
export function CarteKPI({
  label,
  valeurCents,
  variationCents,
  variationRatio,
  precision,
  decimals = 0,
  className,
  accent = false,
}: {
  label: string;
  valeurCents: number;
  variationCents?: number;
  variationRatio?: number;
  precision?: string;
  decimals?: number;
  className?: string;
  /** Met la valeur en couleur d’accent — réservé au chiffre signature de l'écran. */
  accent?: boolean;
}) {
  return (
    <div className={cn('carte carte-interactive p-4 sm:p-5', className)}>
      <p className="label-kpi">{label}</p>
      <p className="mt-2">
        <Montant
          cents={valeurCents}
          decimals={decimals}
          className={cn(
            'text-[20px] font-extrabold tabular-nums tracking-[-0.02em] sm:text-[26px]',
            accent && 'text-primary',
          )}
        />
      </p>
      {variationCents !== undefined && (
        <p className="mt-2">
          <Variation cents={variationCents} ratio={variationRatio} />
        </p>
      )}
      {precision && (
        <p className="mt-2 hidden text-[12px] leading-snug text-text-subtle sm:block">{precision}</p>
      )}
    </div>
  );
}

/** Variante pour un KPI qui n'est pas un montant (taux d'épargne, échéance…). */
export function CarteKPITexte({
  label,
  valeur,
  precision,
  className,
  accent = false,
}: {
  label: string;
  valeur: string;
  precision?: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn('carte carte-interactive p-4 sm:p-5', className)}>
      <p className="label-kpi">{label}</p>
      <p
        className={cn(
          'mt-2 text-[20px] font-extrabold tabular-nums tracking-[-0.02em] sm:text-[26px]',
          accent && 'text-primary',
        )}
      >
        {valeur}
      </p>
      {precision && (
        <p className="mt-2 hidden text-[12px] leading-snug text-text-subtle sm:block">{precision}</p>
      )}
    </div>
  );
}
