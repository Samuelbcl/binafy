'use client';

import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { creerObjectif } from '@/app/(app)/objectifs/actions';
import { ChampNombre, ChampSelect } from '@/components/ui/champs';
import { Montant } from '@/components/ui/montant';
import { PastilleIcone, type Teinte } from '@/components/ui/pastille-icone';
import { cn } from '@/lib/cn';
import { echeanceDans, projeterObjectif } from '@/lib/finance/objectifs';
import { euros, formatEUR, formatEURCompact, formatPercent } from '@/lib/money';
import { libelleDans } from '@/lib/objectifs/dates';
import {
  CLES_ICONE,
  FREQUENCES,
  ICONES_OBJECTIF,
  INSPIRATIONS,
  LIBELLE_FREQUENCE,
  type FrequenceContribution,
  type IconeObjectif,
  type Inspiration,
  type TypeObjectif,
} from '@/lib/objectifs/types';
import { calculerCashNecessaire } from '@/lib/tax/enregistrement';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import type { RegionFiscale } from '@/lib/tax/types';

/**
 * Création d'un objectif, en trois écrans.
 *
 * Un seul formulaire de douze champs fait abandonner au troisième. Trois écrans
 * qui posent chacun une question — *quoi*, *combien et pour quand*, *voilà ce
 * que ça donne* — se remplissent en marchant. Le dernier n'est pas une
 * confirmation : c'est une projection, la première fois que l'objectif prend
 * une forme. Si elle déplaît, on revient d'un geste.
 *
 * Deux inspirations calculent leur cible au lieu de la demander : le matelas de
 * sécurité depuis les charges fixes, l'apport depuis le moteur de frais
 * d'acquisition, par Région. C'est la partie belge du parcours.
 */

export type ActifLiable = { id: string; nom: string; valeurCents: number };

const REGIONS: readonly { valeur: RegionFiscale; libelle: string }[] = [
  { valeur: 'wallonie', libelle: 'Wallonie' },
  { valeur: 'bruxelles', libelle: 'Bruxelles' },
  { valeur: 'flandre', libelle: 'Flandre' },
];

const REPERES_MOIS = [3, 6, 12, 18, 24];
const REPERES_ANNEES = [1, 5, 10, 20, 30];

export function CreationObjectif({
  actifs,
  chargesFixesCents,
  capaciteMensuelleCents,
  region: regionDefaut,
  inspirationInitiale = null,
}: {
  actifs: readonly ActifLiable[];
  chargesFixesCents: number;
  capaciteMensuelleCents: number;
  region: RegionFiscale;
  /** Clé d'inspiration à présélectionner — le lien « créer cet objectif ». */
  inspirationInitiale?: string | null;
}) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const initiale = INSPIRATIONS.find((i) => i.cle === inspirationInitiale) ?? null;

  const [etape, setEtape] = useState<1 | 2 | 3>(1);
  const [inspiration, setInspiration] = useState<Inspiration | null>(initiale);
  const [nom, setNom] = useState(initiale?.nom ?? '');
  const [icone, setIcone] = useState<IconeObjectif>(initiale?.icone ?? 'tirelire');
  const [teinte, setTeinte] = useState<Teinte>(initiale?.teinte ?? 'violet');

  const [cibleEuros, setCibleEuros] = useState(0);
  const [uniteHorizon, setUniteHorizon] = useState<'mois' | 'annees'>('mois');
  const [horizon, setHorizon] = useState(12);
  const [contributionEuros, setContributionEuros] = useState(0);
  const [frequence, setFrequence] = useState<FrequenceContribution>('mois');
  const [lies, setLies] = useState<string[]>([]);

  // Les deux cibles calculées.
  const [moisCouverture, setMoisCouverture] = useState(4);
  const [prixEuros, setPrixEuros] = useState(250_000);
  const [region, setRegion] = useState<RegionFiscale>(regionDefaut);

  const aujourdhui = useMemo(() => new Date(), []);
  const horizonMois = uniteHorizon === 'mois' ? horizon : horizon * 12;
  const echeance = echeanceDans(horizonMois, aujourdhui);
  const atteintCents = actifs
    .filter((a) => lies.includes(a.id))
    .reduce((s, a) => s + a.valeurCents, 0);

  const cibleMatelas = chargesFixesCents * moisCouverture;
  const cibleApport = useMemo(
    () =>
      calculerCashNecessaire(
        { prixCents: euros(prixEuros), region, typeAchat: 'propre_unique' },
        TAX_PARAMS_2026,
      ).result.cashTotalCents,
    [prixEuros, region],
  );

  const projection = useMemo(
    () =>
      projeterObjectif({
        atteintCents,
        cibleCents: euros(cibleEuros),
        contributionCents: contributionEuros > 0 ? euros(contributionEuros) : null,
        frequence: contributionEuros > 0 ? frequence : null,
        horizonMois,
      }),
    [atteintCents, cibleEuros, contributionEuros, frequence, horizonMois],
  );

  function choisirInspiration(i: Inspiration) {
    setInspiration(i);
    setNom(i.nom);
    setIcone(i.icone);
    setTeinte(i.teinte);
    if (i.special === 'matelas' && cibleMatelas > 0) setCibleEuros(Math.round(cibleMatelas / 100));
    if (i.special === 'apport') setCibleEuros(Math.round(cibleApport / 100));
  }

  function basculerLie(id: string) {
    setLies((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  }

  function creer() {
    setErreur(null);
    const type: TypeObjectif =
      inspiration?.special === 'matelas'
        ? 'precaution'
        : inspiration?.special === 'apport'
          ? 'apport_immo'
          : 'libre';

    demarrer(async () => {
      const resultat = await creerObjectif({
        nom,
        icone,
        teinte,
        inspiration: inspiration?.cle ?? null,
        type,
        cibleCents: euros(cibleEuros),
        echeance,
        contributionCents: contributionEuros > 0 ? euros(contributionEuros) : null,
        frequence: contributionEuros > 0 ? frequence : null,
        actifsLies: lies,
      });
      if (resultat.ok) {
        // Le parametre porte la confirmation : la page d'arrivee la montre,
        // et un rechargement ne la remontre pas puisqu'on retire le parametre.
        router.push('/objectifs?cree=1');
        router.refresh();
      } else {
        setErreur(resultat.message);
      }
    });
  }

  const Icone = ICONES_OBJECTIF[icone];
  const reperes = uniteHorizon === 'mois' ? REPERES_MOIS : REPERES_ANNEES;
  const maxHorizon = uniteHorizon === 'mois' ? 24 : 30;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Où on en est dans le parcours : trois traits, celui-ci en couleur. */}
      <header className="flex items-center gap-3">
        {etape > 1 ? (
          <button
            type="button"
            onClick={() => setEtape((e) => (e === 3 ? 2 : 1))}
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius)] text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <ArrowLeft className="size-[18px]" />
            <span className="sr-only">Étape précédente</span>
          </button>
        ) : (
          <Link
            href="/objectifs"
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius)] text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <ArrowLeft className="size-[18px]" />
            <span className="sr-only">Retour aux objectifs</span>
          </Link>
        )}
        <div className="flex flex-1 gap-1.5" aria-label={`Étape ${etape} sur 3`}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                n <= etape ? 'bg-primary' : 'bg-surface-2',
              )}
            />
          ))}
        </div>
        <span className="w-11 text-right text-[12px] tabular-nums text-text-subtle">{etape}/3</span>
      </header>

      {etape === 1 && (
        <section className="apparait mt-6">
          <h1 className="titre-degrade font-display text-[26px] tracking-tight">
            Quel objectif ?
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-text-muted">
            Choisis une piste, ou nomme le tien. Le matelas de sécurité passe avant tout le
            reste : c’est lui qui évite de casser les autres.
          </p>

          <ul className="mt-5 grid grid-cols-2 gap-2.5">
            {INSPIRATIONS.map((i) => {
              const choisi = inspiration?.cle === i.cle;
              return (
                <li key={i.cle}>
                  <button
                    type="button"
                    onClick={() => choisirInspiration(i)}
                    aria-pressed={choisi}
                    className={cn(
                      'carte carte-interactive flex h-full w-full flex-col items-start gap-2.5 p-3.5 text-left transition-colors',
                      choisi && 'border-primary ring-2 ring-primary/30',
                    )}
                  >
                    <PastilleIcone icone={ICONES_OBJECTIF[i.icone]} teinte={i.teinte} />
                    <span className="text-[13.5px] font-semibold leading-snug">{i.nom}</span>
                    {i.special && (
                      <span className="puce bg-primary-soft text-primary">cible calculée</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="carte mt-5 p-4 sm:p-5">
            <label className="label-kpi block" htmlFor="nom-objectif">
              Ou nomme-le toi-même
            </label>
            <input
              id="nom-objectif"
              type="text"
              value={nom}
              maxLength={80}
              placeholder="Un nouveau vélo, le kot de Léa…"
              onChange={(e) => {
                setNom(e.target.value);
                if (inspiration && e.target.value !== inspiration.nom) setInspiration(null);
              }}
              className="mt-1.5 h-11 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-[15px] transition-colors focus:border-primary focus:outline-none"
            />

            <p className="label-kpi mt-4">Son icône</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CLES_ICONE.map((cle) => (
                <button
                  key={cle}
                  type="button"
                  onClick={() => setIcone(cle)}
                  aria-pressed={icone === cle}
                  aria-label={cle}
                  className={cn(
                    'rounded-[var(--radius-sm)] ring-offset-2 ring-offset-surface transition-shadow',
                    icone === cle && 'ring-2 ring-primary',
                  )}
                >
                  <PastilleIcone icone={ICONES_OBJECTIF[cle]} teinte={teinte} />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={nom.trim().length === 0}
            onClick={() => setEtape(2)}
            className="bouton-principal mt-6 w-full disabled:opacity-50"
          >
            Suivant
            <ArrowRight className="size-4" />
          </button>
        </section>
      )}

      {etape === 2 && (
        <section className="apparait mt-6">
          <div className="flex items-center gap-3">
            <PastilleIcone icone={Icone} teinte={teinte} taille="grande" />
            <h1 className="min-w-0 truncate font-display text-[22px] tracking-tight">
              {nom}
            </h1>
          </div>

          {inspiration?.special === 'matelas' && (
            <div className="carte mt-5 p-4 sm:p-5">
              <p className="text-[13.5px] font-semibold">Nestor calcule la cible depuis ton budget</p>
              {chargesFixesCents > 0 ? (
                <>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
                    Tes charges fixes constatées font{' '}
                    <Montant cents={chargesFixesCents} decimals={0} className="font-semibold text-text" />{' '}
                    par mois. Le matelas couvre de trois à six mois — le curseur choisit combien.
                  </p>
                  <label className="mt-4 block">
                    <span className="flex items-baseline justify-between text-[13px]">
                      <span className="text-text-muted">Mois couverts</span>
                      <span className="font-semibold tabular-nums">{moisCouverture} mois</span>
                    </span>
                    <input
                      type="range"
                      min={3}
                      max={6}
                      step={1}
                      value={moisCouverture}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        setMoisCouverture(m);
                        setCibleEuros(Math.round((chargesFixesCents * m) / 100));
                      }}
                      className="mt-2 h-11 w-full cursor-pointer accent-[var(--primary)]"
                    />
                  </label>
                  <p className="text-[13px]">
                    Cible :{' '}
                    <Montant cents={cibleMatelas} decimals={0} className="font-bold text-primary" />
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
                  Importe un extrait bancaire dans le budget et la cible se calculera seule. En
                  attendant, indique-la toi-même : trois à six mois de tes charges fixes.
                </p>
              )}
            </div>
          )}

          {inspiration?.special === 'apport' && (
            <div className="carte mt-5 space-y-4 p-4 sm:p-5">
              <p className="text-[13.5px] font-semibold">
                Nestor calcule le cash à sortir le jour de l’acte
              </p>
              <ChampNombre
                label="Prix du bien"
                valeur={prixEuros}
                onChange={(v) => {
                  setPrixEuros(v);
                  setCibleEuros(
                    Math.round(
                      calculerCashNecessaire(
                        { prixCents: euros(v), region, typeAchat: 'propre_unique' },
                        TAX_PARAMS_2026,
                      ).result.cashTotalCents / 100,
                    ),
                  );
                }}
                suffixe="€"
                pas={5000}
              />
              <ChampSelect
                label="Région"
                valeur={region}
                options={REGIONS}
                onChange={(r) => {
                  setRegion(r);
                  setCibleEuros(
                    Math.round(
                      calculerCashNecessaire(
                        { prixCents: euros(prixEuros), region: r, typeAchat: 'propre_unique' },
                        TAX_PARAMS_2026,
                      ).result.cashTotalCents / 100,
                    ),
                  );
                }}
                aide="Droits d’enregistrement, honoraires et frais d’acte, plus la part que la banque ne prête pas."
              />
              <p className="text-[13px]">
                Cible : <Montant cents={cibleApport} decimals={0} className="font-bold text-primary" />
              </p>
            </div>
          )}

          <div className="carte mt-5 space-y-5 p-4 sm:p-5">
            <ChampNombre
              label="Montant cible"
              valeur={cibleEuros}
              onChange={setCibleEuros}
              suffixe="€"
              pas={100}
            />

            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="label-kpi">Pour quand</span>
                <div role="group" aria-label="Unité" className="flex rounded-full bg-surface-2 p-0.5">
                  {(['mois', 'annees'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      aria-pressed={uniteHorizon === u}
                      onClick={() => {
                        setUniteHorizon(u);
                        setHorizon(u === 'mois' ? 12 : 5);
                      }}
                      className={cn(
                        'rounded-full px-3 py-1 text-[12px] font-semibold transition-colors',
                        uniteHorizon === u ? 'bg-surface text-text shadow-[var(--shadow-card)]' : 'text-text-muted',
                      )}
                    >
                      {u === 'mois' ? 'Mois' : 'Années'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-2 flex items-baseline justify-between text-[13px]">
                <span className="text-text-muted">Échéance</span>
                <span className="font-semibold tabular-nums">
                  dans {horizon} {uniteHorizon === 'mois' ? 'mois' : horizon > 1 ? 'ans' : 'an'}{' '}
                  <span className="text-text-muted">({libelleDans(horizonMois, aujourdhui)})</span>
                </span>
              </p>
              <input
                type="range"
                min={1}
                max={maxHorizon}
                step={1}
                value={horizon}
                aria-label="Échéance"
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="mt-1 h-11 w-full cursor-pointer accent-[var(--primary)]"
              />
              <div className="relative h-4 text-[11px] text-text-subtle">
                {reperes.map((r) => (
                  <span
                    key={r}
                    className="absolute -translate-x-1/2 tabular-nums"
                    style={{ left: `${((r - 1) / (maxHorizon - 1)) * 100}%` }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <ChampNombre
                label="Tu verses"
                valeur={contributionEuros}
                onChange={setContributionEuros}
                suffixe="€"
                pas={10}
                aide={
                  capaciteMensuelleCents > 0
                    ? `Ta capacité constatée : ${formatEUR(capaciteMensuelleCents, { decimals: 0 })} par mois.`
                    : 'Facultatif — sans rythme, Nestor ne projette pas de date.'
                }
              />
              <ChampSelect
                label="Rythme"
                valeur={frequence}
                options={FREQUENCES.map((f) => ({ valeur: f, libelle: LIBELLE_FREQUENCE[f] }))}
                onChange={setFrequence}
                className="w-40"
              />
            </div>
          </div>

          {actifs.length > 0 && (
            <div className="carte mt-4 p-4 sm:p-5">
              <p className="label-kpi">Ce qui compte déjà pour cet objectif</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-text-subtle">
                Rattache les comptes ou positions dont la valeur mesure ta progression.
              </p>
              <ul className="mt-3 space-y-1.5">
                {actifs.map((a) => {
                  const coche = lies.includes(a.id);
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={coche}
                        onClick={() => basculerLie(a.id)}
                        className={cn(
                          'flex min-h-11 w-full items-center gap-3 rounded-[var(--radius)] px-3 text-left text-[14px] transition-colors hover:bg-surface-hover',
                          coche && 'bg-primary-soft',
                        )}
                      >
                        <span
                          className={cn(
                            'grid size-5 shrink-0 place-items-center rounded-[6px] border transition-colors',
                            coche ? 'border-primary bg-primary text-on-primary' : 'border-text-subtle/50',
                          )}
                        >
                          {coche && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{a.nom}</span>
                        <Montant cents={a.valeurCents} decimals={0} className="shrink-0 text-text-muted" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              {atteintCents > 0 && (
                <p className="mt-3 text-[13px]">
                  Déjà là : <Montant cents={atteintCents} decimals={0} className="font-bold" />
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={cibleEuros <= 0}
            onClick={() => setEtape(3)}
            className="bouton-principal mt-6 w-full disabled:opacity-50"
          >
            Voir la projection
            <ArrowRight className="size-4" />
          </button>
        </section>
      )}

      {etape === 3 && (
        <section className="apparait mt-6">
          <div className="flex items-center gap-3">
            <PastilleIcone icone={Icone} teinte={teinte} taille="grande" />
            <h1 className="min-w-0 truncate font-display text-[22px] tracking-tight">
              {nom}
            </h1>
          </div>

          <div className="carte mt-5 p-4 sm:p-5">
            <p className="text-[13.5px] font-semibold">Trajectoire projetée</p>
            <div className="mt-3 flex gap-6 text-[12.5px]">
              <div>
                <span className="flex items-center gap-1.5 text-text-muted">
                  <span className="size-2 rounded-[2px] bg-primary" /> Versements cumulés
                </span>
                <Montant
                  cents={projection.result.atteintAHorizonCents}
                  decimals={0}
                  className="mt-0.5 block text-[17px] font-bold"
                />
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-text-muted">
                  <span className="size-2 rounded-[2px] bg-positive" /> Cible
                </span>
                <Montant
                  cents={euros(cibleEuros)}
                  decimals={0}
                  className="mt-0.5 block text-[17px] font-bold"
                />
              </div>
            </div>

            <div className="mt-3 h-44" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={projection.result.trajectoire.map((p) => ({ mois: p.mois, verse: p.verseCents / 100 }))}
                  margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="degradeObjectif" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="mois"
                    type="number"
                    domain={[0, horizonMois]}
                    ticks={[0, horizonMois]}
                    interval={0}
                    tickFormatter={(m: number) => libelleDans(m, aujourdhui)}
                    tick={{ fill: 'var(--text-subtle)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, (d: number) => Math.max(d, cibleEuros) * 1.1]}
                    tickFormatter={(v: number) => formatEURCompact(v * 100)}
                    tick={{ fill: 'var(--text-subtle)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    tickCount={3}
                  />
                  <ReferenceLine
                    y={cibleEuros}
                    stroke="var(--positive)"
                    strokeDasharray="4 4"
                  />
                  <Area
                    type="linear"
                    dataKey="verse"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#degradeObjectif)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <dl className="mt-3 divide-y divide-border/60 text-[14px]">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-text-muted">Cible</dt>
                <dd>
                  <Montant cents={euros(cibleEuros)} decimals={0} className="font-semibold" />
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-text-muted">Déjà là</dt>
                <dd>
                  <Montant cents={atteintCents} decimals={0} className="font-semibold" />
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-text-muted">Comptes rattachés</dt>
                <dd className="text-right font-semibold">
                  {lies.length === 0
                    ? '—'
                    : actifs
                        .filter((a) => lies.includes(a.id))
                        .map((a) => a.nom)
                        .join(', ')}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-text-muted">Échéance</dt>
                <dd className="font-semibold">{libelleDans(horizonMois, aujourdhui)}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-text-muted">Tu verses</dt>
                <dd className="font-semibold">
                  {contributionEuros > 0
                    ? `${formatEUR(euros(contributionEuros), { decimals: 0 })} ${LIBELLE_FREQUENCE[frequence]}`
                    : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-text-muted">Rendement qu’il faudrait</dt>
                <dd
                  className={cn(
                    'font-semibold tabular-nums',
                    projection.result.rendementRequis === 0 && 'text-positive',
                    projection.result.rendementRequis === null && 'text-warning',
                  )}
                >
                  {projection.result.rendementRequis === null
                    ? 'hors de portée'
                    : formatPercent(projection.result.rendementRequis, { decimals: 1 })}
                  <span className="ml-1 text-[12px] font-normal text-text-subtle">par an, brut</span>
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-[12px] leading-relaxed text-text-subtle">
              {projection.result.rendementRequis === 0
                ? 'Le rythme suffit sans aucun rendement : un compte d’épargne y arrive.'
                : projection.result.rendementRequis === null
                  ? 'Aucun rendement raisonnable ne comble l’écart. Il faudra verser plus, ou viser plus loin.'
                  : 'C’est le taux qui comblerait l’écart. Nestor ne dit pas où le trouver — et la fiscalité belge le rendrait plus haut encore.'}
            </p>
          </div>

          {erreur && (
            <p role="alert" className="mt-4 rounded-[var(--radius)] bg-negative/10 px-4 py-3 text-[13px] text-negative">
              {erreur}
            </p>
          )}

          <button
            type="button"
            disabled={enCours}
            onClick={creer}
            className="bouton-chaud mt-6 w-full disabled:opacity-60"
          >
            {enCours ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Créer mon objectif
          </button>
        </section>
      )}
    </div>
  );
}
