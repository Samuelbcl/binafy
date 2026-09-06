'use client';

import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { useMemo, useState } from 'react';
import { useDiscretion } from '@/components/providers';
import { cn } from '@/lib/cn';
import type { FluxSankey } from '@/lib/db/budget';
import { formatEUR, formatEURCompact, MASK, NBSP } from '@/lib/money';

/**
 * Sankey budgétaire (doc 05 § Sankey, doc 10).
 *
 * Le meilleur élément d'interface du marché, repris comme pattern et rendu
 * cliquable : un clic sur un flux filtre la liste des transactions.
 *
 * Sur mobile, un Sankey à 380px est illisible : on bascule sur une liste
 * hiérarchique, qui dit la même chose sans prétendre être un graphique.
 */

type Noeud = { nom: string };
type Lien = { source: string; target: string; value: number; couleur: string };

const LARGEUR = 720;
const HAUTEUR = 340;

export function SankeyBudget({
  flux,
  onSelection,
  className,
}: {
  flux: FluxSankey[];
  /** Appelé au clic sur un flux, pour filtrer la liste des transactions. */
  onSelection?: (cible: string | null) => void;
  className?: string;
}) {
  const { discret } = useDiscretion();
  const [survole, setSurvole] = useState<number | null>(null);
  const [selection, setSelection] = useState<string | null>(null);

  const graphe = useMemo(() => {
    if (flux.length === 0) return null;

    // On identifie les nœuds par leur nom plutôt que par un index : le code
    // reste lisible et l'ordre des flux n'a plus d'importance.
    const noms = new Set<string>();
    for (const f of flux) {
      noms.add(f.source);
      noms.add(f.cible);
    }

    const generateur = sankey<Noeud, Lien>()
      .nodeWidth(14)
      .nodePadding(16)
      .nodeId((noeud) => noeud.nom)
      .extent([
        [1, 8],
        [LARGEUR - 1, HAUTEUR - 8],
      ]);

    try {
      return generateur({
        nodes: [...noms].map((nom) => ({ nom })),
        links: flux.map((f) => ({
          source: f.source,
          target: f.cible,
          value: f.valeurCents,
          couleur: f.couleur,
        })),
      });
    } catch {
      // Un graphe cyclique ou dégénéré ne doit pas casser la page : on retombe
      // sur la liste hiérarchique.
      return null;
    }
  }, [flux]);

  function selectionner(cible: string) {
    const suivante = selection === cible ? null : cible;
    setSelection(suivante);
    onSelection?.(suivante);
  }

  if (flux.length === 0) {
    return (
      <div className={cn('carte p-5 sm:p-6', className)}>
        <h2 className="font-display text-[17px] font-semibold">Flux du mois</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
          Le diagramme apparaîtra dès qu’un mois complet de transactions sera importé.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('carte p-5 sm:p-6', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-[17px] font-semibold">Flux du mois</h2>
        {selection && (
          <button
            type="button"
            onClick={() => selectionner(selection)}
            className="text-[12px] text-primary underline underline-offset-2"
          >
            Retirer le filtre « {selection} »
          </button>
        )}
      </div>

      {/* Diagramme — masqué sous sm, où il serait illisible. */}
      {graphe && (
        <div className="mt-4 hidden overflow-x-auto sm:block">
          <svg
            viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
            className="h-auto w-full min-w-[560px]"
            role="img"
            aria-label="Diagramme des flux budgétaires du mois"
          >
            <defs>
              {graphe.links.map((lien, i) => (
                <linearGradient
                  key={i}
                  id={`sankey-${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={(lien.source as Noeud & { x1?: number }).x1 ?? 0}
                  x2={(lien.target as Noeud & { x0?: number }).x0 ?? 0}
                >
                  <stop offset="0%" stopColor="var(--data-8)" />
                  <stop offset="100%" stopColor={lien.couleur} />
                </linearGradient>
              ))}
            </defs>

            {graphe.links.map((lien, i) => {
              const chemin = sankeyLinkHorizontal()(lien as never);
              const cible = (lien.target as Noeud).nom;
              const actif = survole === i || selection === cible;

              return (
                <path
                  key={i}
                  d={chemin ?? undefined}
                  fill="none"
                  stroke={`url(#sankey-${i})`}
                  strokeWidth={Math.max(1, lien.width ?? 1)}
                  strokeOpacity={actif ? 0.85 : selection ? 0.2 : 0.55}
                  className="cursor-pointer transition-[stroke-opacity] duration-150"
                  onMouseEnter={() => setSurvole(i)}
                  onMouseLeave={() => setSurvole(null)}
                  onClick={() => selectionner(cible)}
                >
                  <title>
                    {`${(lien.source as Noeud).nom} → ${cible} : ${
                      discret ? MASK : formatEUR(lien.value ?? 0, { decimals: 0 })
                    }`}
                  </title>
                </path>
              );
            })}

            {graphe.nodes.map((noeud, i) => {
              const n = noeud as Noeud & {
                x0: number;
                x1: number;
                y0: number;
                y1: number;
                value: number;
              };
              const hauteur = Math.max(1, n.y1 - n.y0);
              const aDroite = n.x0 > LARGEUR / 2;

              return (
                <g key={i}>
                  <rect
                    x={n.x0}
                    y={n.y0}
                    width={n.x1 - n.x0}
                    height={hauteur}
                    rx={3}
                    fill="var(--text-subtle)"
                    fillOpacity={0.5}
                  />
                  <text
                    x={aDroite ? n.x0 - 8 : n.x1 + 8}
                    y={(n.y0 + n.y1) / 2}
                    dy="0.35em"
                    textAnchor={aDroite ? 'end' : 'start'}
                    className="fill-[var(--text-muted)] text-[11px]"
                  >
                    {n.nom}
                    <tspan className="fill-[var(--text-subtle)]">
                      {NBSP}
                      {discret ? MASK : formatEURCompact(n.value)}
                    </tspan>
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Liste hiérarchique — seule vue sous sm, doublure accessible au-dessus. */}
      <ul className={cn('mt-4 space-y-2', graphe && 'sm:hidden')}>
        {flux.map((f, i) => {
          const actif = selection === f.cible;

          return (
            <li key={`${f.source}-${f.cible}-${i}`}>
              <button
                type="button"
                onClick={() => selectionner(f.cible)}
                className={cn(
                  'flex w-full items-baseline justify-between gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-left transition-colors hover:bg-surface-hover',
                  actif && 'bg-primary-soft',
                )}
              >
                <span className="flex min-w-0 items-center gap-2 text-[13px]">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ background: f.couleur }}
                  />
                  <span className={cn('truncate', f.source !== 'Revenus' && 'text-text-muted')}>
                    {f.source === 'Revenus' ? f.cible : `${f.cible}`}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[13px] tabular-nums">
                  {discret ? `${MASK}${NBSP}€` : formatEUR(f.valeurCents, { decimals: 0 })}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] text-text-subtle">
        Clique un flux pour filtrer les transactions correspondantes.
      </p>
    </div>
  );
}
