'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ChampBascule, ChampNombre } from '@/components/ui/champs';
import { Montant } from '@/components/ui/montant';
import { MentionInformative, PanneauExplication } from '@/components/ui/panneau-explication';
import { useEtatUrl } from '@/lib/use-etat-url';
import { euros, formatPercent } from '@/lib/money';
import { calculerCapaciteEmprunt } from '@/lib/finance/credit';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';

/**
 * Capacité d'emprunt (doc 07 § 3).
 *
 * Deux choses distinguent ce calculateur de celui d'une banque : il montre le
 * **reste à vivre** au lieu de le taire, et il ne retient qu'une part du loyer
 * attendu en locatif — comme le font réellement les banques, jamais 100 %.
 *
 * `?revenus=2400&charges=0&duree=25&taux=3.4&loyer=0`
 */

export type ValeursCapacite = {
  revenus: number;
  charges: number;
  duree: number;
  taux: number;
  loyer: number;
  locatif: boolean;
};

export function OutilCapaciteEmprunt({ initiales }: { initiales: ValeursCapacite }) {
  const [v, definir] = useEtatUrl(initiales);

  const calcul = useMemo(
    () =>
      calculerCapaciteEmprunt(
        {
          revenusNetsMensuelsCents: euros(v.revenus),
          chargesMensuellesCents: euros(v.charges),
          dureeAnnees: v.duree,
          tauxAnnuelPourcent: v.taux,
          loyerAttenduMensuelCents: v.locatif ? euros(v.loyer) : 0,
        },
        TAX_PARAMS_2026,
      ),
    [v.revenus, v.charges, v.duree, v.taux, v.loyer, v.locatif],
  );

  const { result } = calcul;

  // Part des revenus absorbée par la mensualité — la lecture la plus parlante.
  const partMensualite =
    result.revenusPrisEnCompteCents > 0
      ? result.mensualiteMaxCents / result.revenusPrisEnCompteCents
      : 0;

  return (
    <div className="space-y-6">
      <section className="carte p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <ChampNombre
            label="Revenus nets du ménage"
            valeur={v.revenus}
            onChange={(x) => definir('revenus', x)}
            suffixe="€/mois"
            pas={100}
            aide="Salaires nets, après précompte professionnel."
          />
          <ChampNombre
            label="Crédits déjà en cours"
            valeur={v.charges}
            onChange={(x) => definir('charges', x)}
            suffixe="€/mois"
            pas={50}
            aide="Voiture, prêt personnel, autre crédit hypothécaire."
          />
          <ChampNombre
            label="Durée"
            valeur={v.duree}
            onChange={(x) => definir('duree', x)}
            suffixe="ans"
            min={5}
            max={30}
            pas={1}
          />
          <ChampNombre
            label="Taux annuel"
            valeur={v.taux}
            onChange={(x) => definir('taux', x)}
            suffixe="%"
            pas={0.1}
            aide="Taux fixe proposé par ta banque, hors assurances."
          />
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <ChampBascule
            label="C’est un investissement locatif"
            valeur={v.locatif}
            onChange={(x) => definir('locatif', x)}
            aide="La banque ne retient qu’une partie du loyer attendu dans tes revenus."
          />
          {v.locatif && (
            <div className="mt-4 sm:max-w-xs">
              <ChampNombre
                label="Loyer attendu"
                valeur={v.loyer}
                onChange={(x) => definir('loyer', x)}
                suffixe="€/mois"
                pas={50}
              />
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[var(--radius-xl)] bg-primary p-6 text-on-primary sm:p-8">
        <p className="text-[13px] opacity-75">Montant empruntable</p>
        <p className="chiffre-hero mt-2">
          <Montant cents={result.capaciteEmpruntCents} decimals={0} className="text-on-primary" />
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="puce bg-on-primary/15 tabular-nums">
            Mensualité max{' '}
            <Montant
              cents={result.mensualiteMaxCents}
              decimals={0}
              className="font-bold text-on-primary"
            />
          </span>
          <span className="puce bg-on-primary/15 tabular-nums">
            {formatPercent(partMensualite)} des revenus retenus
          </span>
          <span className="puce bg-on-primary/15">
            sur {v.duree} ans à {v.taux.toLocaleString('fr-BE')} %
          </span>
        </div>
      </section>

      {result.resteAVivreInsuffisant && (
        <section className="carte flex gap-3 p-5">
          <AlertTriangle className="size-5 shrink-0 text-warning" />
          <div>
            <h2 className="text-[15px] font-bold">Le reste à vivre passe sous le plancher</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-muted">
              Avec cette mensualité, il te resterait{' '}
              <Montant cents={result.resteAVivreCents} decimals={0} className="font-semibold" /> par
              mois pour vivre. Une banque refusera le dossier ou exigera un apport plus important.
              Le montant ci-dessus reste le maximum théorique : il n’est pas ce qu’on t’accordera.
            </p>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1 sm:gap-4 lg:grid-cols-3">
        <div className="carte p-4 sm:p-5">
          <p className="label-kpi">Reste à vivre</p>
          <p className="mt-2 text-[19px] font-extrabold tracking-[-0.02em] sm:text-[22px]">
            <Montant cents={result.resteAVivreCents} decimals={0} />
          </p>
          <p className="mt-2 text-[12.5px] leading-snug text-text-subtle">
            Après mensualité et crédits en cours.
          </p>
        </div>
        <div className="carte p-4 sm:p-5">
          <p className="label-kpi">Intérêts payés en tout</p>
          <p className="mt-2 text-[19px] font-extrabold tracking-[-0.02em] sm:text-[22px]">
            <Montant cents={result.interetsTotauxCents} decimals={0} />
          </p>
          <p className="mt-2 text-[12.5px] leading-snug text-text-subtle">
            Le prix du crédit, sur toute sa durée.
          </p>
        </div>
        <div className="carte p-4 sm:p-5">
          <p className="label-kpi">Coût total du crédit</p>
          <p className="mt-2 text-[19px] font-extrabold tracking-[-0.02em] sm:text-[22px]">
            <Montant cents={result.coutTotalCreditCents} decimals={0} />
          </p>
          <p className="mt-2 text-[12.5px] leading-snug text-text-subtle">
            Capital et intérêts cumulés.
          </p>
        </div>
      </section>

      <PanneauExplication calcul={calcul} />

      <section className="carte p-5 sm:p-6">
        <h2 className="text-[16px] font-bold">Ce que ce calcul ne dit pas</h2>
        <ul className="mt-3 list-disc space-y-2 pl-4 text-[13.5px] leading-relaxed text-text-muted marker:text-text-subtle">
          <li>
            Emprunter ne suffit pas : il faut aussi le cash de l’acte — droits d’enregistrement,
            honoraires, frais d’acte de crédit. C’est souvent ce qui bloque, pas la capacité.
          </li>
          <li>
            Les assurances solde restant dû et incendie ne sont pas comprises dans la mensualité
            affichée. Compte-les en plus.
          </li>
          <li>
            Chaque banque applique ses propres règles d’octroi. Deux banques peuvent différer de
            30 000 € sur le même dossier.
          </li>
        </ul>
      </section>

      <MentionInformative />
    </div>
  );
}
