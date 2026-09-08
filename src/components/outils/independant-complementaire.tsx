'use client';

import { useMemo } from 'react';
import { ChampBascule, ChampNombre, ChampSelect } from '@/components/ui/champs';
import { Montant } from '@/components/ui/montant';
import { MentionInformative, PanneauExplication } from '@/components/ui/panneau-explication';
import { useEtatUrl } from '@/lib/use-etat-url';
import { euros, formatPercent } from '@/lib/money';
import {
  CAISSES,
  LIBELLE_CAISSE,
  calculerCotisationsSociales,
  calculerCoutDemarrage,
  type Caisse,
} from '@/lib/tax/independant';
import { calculerImpotRevenuComplementaire } from '@/lib/tax/ipp';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';

/**
 * Coût réel d'un indépendant complémentaire (doc 09).
 *
 * Le calcul que personne ne fait avant de se lancer : sur 100 € facturés, ce qui
 * reste après cotisations sociales **et** impôt. L'impôt est le poste sous-estimé,
 * parce qu'un revenu complémentaire s'empile sur le salaire et se fait donc taxer
 * au taux marginal, pas au taux moyen.
 *
 * `?revenu=8000&salaire=32000&caisse=acerta&tva=true&communaux=8`
 */

export type ValeursIndependant = {
  revenu: number;
  salaire: number;
  caisse: string;
  tva: boolean;
  communaux: number;
};

const OPTIONS_CAISSE = CAISSES.map((c) => ({ valeur: c, libelle: LIBELLE_CAISSE[c] }));

export function OutilIndependantComplementaire({
  initiales,
}: {
  initiales: ValeursIndependant;
}) {
  const [v, definir] = useEtatUrl(initiales);
  const caisse = (CAISSES.includes(v.caisse as Caisse) ? v.caisse : 'acerta') as Caisse;

  const cotisations = useMemo(
    () =>
      calculerCotisationsSociales(
        {
          revenuNetImposableCents: euros(v.revenu),
          statut: 'complementaire',
          caisse,
        },
        TAX_PARAMS_2026,
      ),
    [v.revenu, caisse],
  );

  // Les cotisations sont déductibles : l'impôt porte sur ce qui reste après elles.
  const revenuApresCotisationsCents = Math.max(
    0,
    euros(v.revenu) - cotisations.result.totalCents,
  );

  const impot = useMemo(
    () =>
      calculerImpotRevenuComplementaire(
        {
          revenuPrincipalCents: euros(v.salaire),
          revenuComplementaireCents: revenuApresCotisationsCents,
          additionnelsCommunauxPourcent: v.communaux,
        },
        TAX_PARAMS_2026,
      ),
    [v.salaire, revenuApresCotisationsCents, v.communaux],
  );

  const demarrage = useMemo(
    () => calculerCoutDemarrage({ avecTVA: v.tva }, TAX_PARAMS_2026),
    [v.tva],
  );

  const netCents = Math.max(
    0,
    euros(v.revenu) - cotisations.result.totalCents - impot.result.impotSupplementaireCents,
  );
  const partGardee = v.revenu > 0 ? netCents / euros(v.revenu) : 0;

  return (
    <div className="space-y-6">
      <section className="carte p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <ChampNombre
            label="Revenu net de l’activité"
            valeur={v.revenu}
            onChange={(x) => definir('revenu', x)}
            suffixe="€/an"
            pas={500}
            aide="Ce que tu factures, moins tes frais professionnels."
          />
          <ChampNombre
            label="Salaire brut imposable"
            valeur={v.salaire}
            onChange={(x) => definir('salaire', x)}
            suffixe="€/an"
            pas={1_000}
            aide="Ton emploi principal : il détermine la tranche où tombe le complément."
          />
          <ChampSelect
            label="Caisse d’assurances sociales"
            valeur={caisse}
            options={OPTIONS_CAISSE}
            onChange={(x) => definir('caisse', x)}
            aide="Les frais de gestion vont de 3,05 % à 4,25 % — un tiers d’écart sur cette ligne."
          />
          <ChampNombre
            label="Additionnels communaux"
            valeur={v.communaux}
            onChange={(x) => definir('communaux', x)}
            suffixe="%"
            pas={0.5}
            aide="Varie fortement d’une commune à l’autre. Liège : 8,5 %."
          />
        </div>
      </section>

      <section className="carte-accent p-6 sm:p-8">
        <p className="text-[13px] opacity-75">Ce qu’il te reste vraiment</p>
        <p className="chiffre-hero mt-2">
          <Montant cents={netCents} decimals={0} className="text-on-primary" />
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="puce bg-on-primary/15 tabular-nums">
            {formatPercent(partGardee)} de ce que tu factures
          </span>
          <span className="puce bg-on-primary/15 tabular-nums">
            Taux effectif {formatPercent(impot.result.tauxEffectif)} sur le complément
          </span>
        </div>
        <p className="mt-5 text-[13.5px] leading-relaxed opacity-90">
          Un revenu complémentaire s’ajoute au salaire : il est imposé dans la tranche du dessus,
          pas au taux moyen. C’est le poste que les simulateurs de cotisations ignorent.
        </p>
      </section>

      <section className="carte overflow-hidden">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-[16px]">Du chiffre facturé à ce qui reste</h2>
        </div>
        <dl className="divide-y divide-border text-[14px]">
          <div className="flex items-baseline justify-between px-5 py-3.5 sm:px-6">
            <dt className="text-text-muted">Revenu net de l’activité</dt>
            <dd className="font-semibold">
              <Montant cents={euros(v.revenu)} decimals={0} />
            </dd>
          </div>
          <div className="flex items-baseline justify-between px-5 py-3.5 sm:px-6">
            <dt className="text-text-muted">
              Cotisations sociales
              <span className="mt-0.5 block text-[12.5px] text-text-subtle">
                Trimestrielles, provisoires, régularisées deux ans plus tard
              </span>
            </dt>
            <dd className="font-semibold text-negative">
              <Montant cents={-cotisations.result.cotisationsCents} decimals={0} />
            </dd>
          </div>
          <div className="flex items-baseline justify-between px-5 py-3.5 sm:px-6">
            <dt className="text-text-muted">Frais de gestion — {LIBELLE_CAISSE[caisse]}</dt>
            <dd className="font-semibold text-negative">
              <Montant cents={-cotisations.result.fraisGestionCents} decimals={0} />
            </dd>
          </div>
          <div className="flex items-baseline justify-between px-5 py-3.5 sm:px-6">
            <dt className="text-text-muted">
              Impôt supplémentaire
              <span className="mt-0.5 block text-[12.5px] text-text-subtle">
                Sur le revenu après déduction des cotisations
              </span>
            </dt>
            <dd className="font-semibold text-negative">
              <Montant cents={-impot.result.impotSupplementaireCents} decimals={0} />
            </dd>
          </div>
          <div className="flex items-baseline justify-between bg-surface-2 px-5 py-4 sm:px-6">
            <dt className="font-bold">Net dans ta poche</dt>
            <dd className="text-[18px] font-semibold">
              <Montant cents={netCents} decimals={0} />
            </dd>
          </div>
        </dl>
      </section>

      {cotisations.result.sousLeSeuil && (
        <section className="carte p-5">
          <h2 className="text-[15px]">Sous le seuil de cotisation</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-muted">
            À ce niveau de revenu, l’activité reste sous le seuil d’exemption du statut
            complémentaire (
            <Montant cents={cotisations.result.seuilCents} decimals={0} className="font-semibold" />
            ). Les cotisations dues sont donc nulles — mais l’affiliation à une caisse et
            l’inscription à la BCE, elles, restent obligatoires.
          </p>
        </section>
      )}

      <PanneauExplication calcul={cotisations} titre="D’où viennent les cotisations" />
      <PanneauExplication calcul={impot} titre="D’où vient l’impôt supplémentaire" />

      <section className="carte p-5 sm:p-6">
        <h2 className="text-[16px]">Ce que ça coûte de se lancer</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-muted">
          Les frais de démarrage, une fois, avant le premier euro facturé.
        </p>
        <div className="mt-4">
          <ChampBascule
            label="Activer un numéro de TVA"
            valeur={v.tva}
            onChange={(x) => definir('tva', x)}
            aide="Obligatoire au-delà du seuil de franchise, ou par choix si tu factures des professionnels."
          />
        </div>
        <p className="mt-5 text-[26px] font-semibold tracking-[-0.025em]">
          <Montant cents={demarrage.result.totalCents} decimals={0} />
        </p>
        <PanneauExplication calcul={demarrage} className="mt-4" />
      </section>

      <MentionInformative />
    </div>
  );
}
