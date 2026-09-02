'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

/** Champs de formulaire des simulateurs. Sobres, larges, tactiles ≥ 44px. */

export function ChampNombre({
  label,
  valeur,
  onChange,
  suffixe,
  min = 0,
  max,
  pas = 1,
  aide,
  className,
}: {
  label: string;
  valeur: number;
  onChange: (v: number) => void;
  suffixe?: string;
  min?: number;
  max?: number;
  pas?: number;
  aide?: string;
  className?: string;
}) {
  const id = useId();

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="label-kpi block">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={Number.isFinite(valeur) ? valeur : ''}
          min={min}
          max={max}
          step={pas}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(Number.isFinite(v) ? v : 0);
          }}
          className={cn(
            'h-11 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 font-mono text-[15px] tabular-nums transition-colors',
            'focus:border-primary focus:outline-none',
            suffixe && 'pr-12',
          )}
        />
        {suffixe && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-text-subtle">
            {suffixe}
          </span>
        )}
      </div>
      {aide && <p className="text-[11px] leading-snug text-text-subtle">{aide}</p>}
    </div>
  );
}

export function ChampSelect<T extends string>({
  label,
  valeur,
  options,
  onChange,
  aide,
  className,
}: {
  label: string;
  valeur: T;
  options: readonly { valeur: T; libelle: string }[];
  onChange: (v: T) => void;
  aide?: string;
  className?: string;
}) {
  const id = useId();

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="label-kpi block">
        {label}
      </label>
      <select
        id={id}
        value={valeur}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-11 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-[14px] transition-colors focus:border-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
      {aide && <p className="text-[11px] leading-snug text-text-subtle">{aide}</p>}
    </div>
  );
}

/** Groupe de boutons radio, pour un choix court et visible d'un coup d'œil. */
export function ChampChoix<T extends string>({
  label,
  valeur,
  options,
  onChange,
  aide,
  className,
}: {
  label: string;
  valeur: T;
  options: readonly { valeur: T; libelle: string }[];
  onChange: (v: T) => void;
  aide?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <span className="label-kpi block">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.valeur}
            type="button"
            role="radio"
            aria-checked={valeur === o.valeur}
            onClick={() => onChange(o.valeur)}
            className={cn(
              'min-h-11 rounded-[var(--radius)] border px-3.5 text-[13px] font-medium transition-colors',
              valeur === o.valeur
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border text-text-muted hover:bg-surface-hover hover:text-text',
            )}
          >
            {o.libelle}
          </button>
        ))}
      </div>
      {aide && <p className="text-[11px] leading-snug text-text-subtle">{aide}</p>}
    </div>
  );
}

export function ChampBascule({
  label,
  valeur,
  onChange,
  aide,
}: {
  label: string;
  valeur: boolean;
  onChange: (v: boolean) => void;
  aide?: string;
}) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={valeur}
          onClick={() => onChange(!valeur)}
          className={cn(
            'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
            valeur ? 'border-primary bg-primary' : 'border-border bg-surface-2',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 size-4 rounded-full transition-transform',
              valeur ? 'translate-x-[22px] bg-on-primary' : 'translate-x-0.5 bg-text-muted',
            )}
          />
        </button>
        <label htmlFor={id} className="text-[14px]">
          {label}
        </label>
      </div>
      {aide && <p className="text-[11px] leading-snug text-text-subtle">{aide}</p>}
    </div>
  );
}
