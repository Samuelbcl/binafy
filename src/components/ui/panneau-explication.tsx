'use client';

import { AlertTriangle, ChevronDown, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { formatEUR, formatTaux } from '@/lib/money';
import type { BreakdownLine, CalcResult, SourceRef } from '@/lib/tax/types';

/**
 * Panneau « D'où vient ce chiffre » (doc 02 § 4, doc 07).
 *
 * Chaque calculateur retourne `{ result, breakdown, sources, hypotheses }` et ce
 * panneau les affiche. C'est ce qui transforme l'app en outil de référence :
 * l'utilisateur ne veut pas juste un chiffre, il veut comprendre.
 *
 * Il porte aussi l'avertissement quand un paramètre fiscal n'a pas encore été
 * confirmé à la source officielle — on préfère le dire que de laisser croire.
 */

function valeurFormatee(ligne: BreakdownLine): string {
  switch (ligne.unite) {
    case 'eur':
      return formatEUR(ligne.valeur, { sign: ligne.valeur < 0 ? 'auto' : 'auto' });
    case 'pourcent':
      return formatTaux(ligne.valeur, ligne.valeur % 1 === 0 ? 0 : 2);
    case 'annees':
      return `${ligne.valeur} an${ligne.valeur > 1 ? 's' : ''}`;
    case 'coefficient':
      return String(ligne.valeur);
    case 'texte':
      return ligne.valeur ? 'Oui' : 'Non';
    default:
      return String(ligne.valeur);
  }
}

function formatDate(iso: string): string {
  const [annee, mois, jour] = iso.split('-');
  return `${jour}/${mois}/${annee}`;
}

export function BandeauNonVerifie({ sources }: { sources: readonly SourceRef[] }) {
  const aVerifier = sources.filter((s) => !s.verifie);
  if (aVerifier.length === 0) return null;

  return (
    <div className="flex gap-2.5 rounded-[var(--radius)] border border-warning/30 bg-warning/8 p-3 text-[12px] leading-relaxed">
      <AlertTriangle className="mt-px size-4 shrink-0 text-warning" />
      <p className="text-text-muted">
        <span className="font-medium text-text">
          {aVerifier.length} paramètre{aVerifier.length > 1 ? 's' : ''} en attente de vérification
        </span>{' '}
        à la source officielle. L’ordre de grandeur est correct, le chiffre exact reste à
        confirmer avant de fonder une décision dessus.
      </p>
    </div>
  );
}

export function PanneauExplication<T>({
  calcul,
  titre = 'D’où vient ce chiffre',
  ouvertParDefaut = false,
  className,
}: {
  calcul: CalcResult<T>;
  titre?: string;
  ouvertParDefaut?: boolean;
  className?: string;
}) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut);
  const { breakdown, sources, hypotheses } = calcul;

  return (
    <div className={cn('carte overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-hover"
      >
        <span className="text-[14px] font-medium">{titre}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-text-muted transition-transform duration-200',
            ouvert && 'rotate-180',
          )}
        />
      </button>

      {ouvert && (
        <div className="space-y-4 border-t border-border px-5 py-4">
          <BandeauNonVerifie sources={sources} />

          {breakdown.length > 0 && (
            <table className="w-full text-[13px]">
              <caption className="sr-only">Détail du calcul</caption>
              <tbody>
                {breakdown.map((ligne, i) => (
                  <tr
                    key={`${ligne.libelle}-${i}`}
                    className={cn(
                      'border-b border-border/40 last:border-0',
                      ligne.total && 'font-medium',
                    )}
                  >
                    <th
                      scope="row"
                      className={cn(
                        'py-2 pr-4 text-left font-normal align-top',
                        ligne.total ? 'text-text' : 'text-text-muted',
                      )}
                    >
                      {ligne.libelle}
                      {ligne.precision && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-text-subtle">
                          {ligne.precision}
                        </span>
                      )}
                    </th>
                    <td
                      className={cn(
                        'py-2 text-right font-mono tabular-nums align-top whitespace-nowrap',
                        ligne.total && 'text-[14px]',
                      )}
                    >
                      {valeurFormatee(ligne)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {hypotheses.length > 0 && (
            <div>
              <h4 className="label-kpi">Hypothèses</h4>
              <ul className="mt-2 space-y-1.5">
                {hypotheses.map((h, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-[12px] leading-relaxed text-text-muted"
                  >
                    <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-text-subtle" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sources.length > 0 && (
            <div>
              <h4 className="label-kpi">Sources</h4>
              <ul className="mt-2 space-y-1.5">
                {sources.map((s) => (
                  <li key={`${s.cle}-${s.annee}`} className="text-[12px] leading-relaxed">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-start gap-1.5 text-text-muted transition-colors hover:text-primary"
                    >
                      <span>
                        {s.libelle}
                        <span className="text-text-subtle">
                          {' '}
                          — {s.annee}, vérifié le {formatDate(s.verifieLe)}
                          {!s.verifie && ' (à confirmer)'}
                        </span>
                      </span>
                      <ExternalLink className="mt-0.5 size-3 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mention réglementaire de pied de page (doc 06 § 7).
 * Obligatoire sur toute page qui produit un chiffre.
 */
export function MentionInformative({ className }: { className?: string }) {
  return (
    <p className={cn('text-[11px] leading-relaxed text-text-subtle', className)}>
      Simulation informative fondée sur les paramètres fiscaux belges en vigueur. Ne constitue
      ni un conseil fiscal ni un conseil en investissement. Pour une situation personnelle,
      consultez un comptable ou un conseiller fiscal agréé.
    </p>
  );
}
