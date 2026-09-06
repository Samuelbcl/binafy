'use client';

import { useMemo } from 'react';
import { ChampBascule, ChampChoix, ChampNombre } from '@/components/ui/champs';
import { Montant } from '@/components/ui/montant';
import { MentionInformative, PanneauExplication } from '@/components/ui/panneau-explication';
import { useEtatUrl } from '@/lib/use-etat-url';
import { calculerRendementLocatif } from '@/lib/finance/locatif';
import { euros, formatEUR, formatPercent } from '@/lib/money';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import { LIBELLE_REGION, REGIONS, type RegionFiscale } from '@/lib/tax/types';

/**
 * Rendement locatif belge (doc 07 § 4).
 *
 * Le chiffre qui compte n'est ni le rendement brut ni le rendement net de
 * charges : c'est le cash-flow après impôt. Un rendement brut de 6 % qui donne
 * un cash-flow négatif est un piège, et c'est le cas le plus fréquent.
 */

export type ValeursLocatif = {
  prix: number;
  loyer: number;
  rc: number;
  marginal: number;
  charges: number;
  precompte: number;
  vacance: number;
  travaux: number;
  quotite: number;
  taux: number;
  duree: number;
  region: RegionFiscale;
  credit: boolean;
};

export function OutilRendementLocatif({ initiales }: { initiales: ValeursLocatif }) {
  // Les valeurs viennent du serveur : le résultat est ainsi présent dans le HTML,
  // ce qui compte pour une page qui sert de porte d'entrée depuis les moteurs.
  const [v, definir] = useEtatUrl(initiales);
  const region = v.region;
  const aCredit = v.credit;

  const calcul = useMemo(
    () =>
      calculerRendementLocatif(
        {
          prixCents: euros(v.prix),
          region,
          loyerMensuelCents: euros(v.loyer),
          revenuCadastralCents: euros(v.rc),
          tauxMarginal: v.marginal / 100,
          chargesAnnuellesCents: euros(v.charges),
          precompteImmobilierAnnuelCents: euros(v.precompte),
          vacancePourcent: v.vacance,
          provisionTravauxAnnuelleCents: euros(v.travaux),
          credit: aCredit
            ? { quotitePourcent: v.quotite, tauxAnnuelPourcent: v.taux, dureeAnnees: v.duree }
            : undefined,
        },
        TAX_PARAMS_2026,
      ),
    [
      v.prix,
      v.loyer,
      v.rc,
      v.marginal,
      v.charges,
      v.precompte,
      v.vacance,
      v.travaux,
      v.quotite,
      v.taux,
      v.duree,
      region,
      aCredit,
    ],
  );

  const { result } = calcul;
  const negatif = result.cashFlowMensuelCents < 0;

  const rendements = [
    { libelle: 'Rendement brut', valeur: result.rendementBrut, ton: 'text-text-muted' },
    { libelle: 'Net de charges', valeur: result.rendementNetCharges, ton: 'text-text-muted' },
    { libelle: 'Net d’impôt', valeur: result.rendementNetImpot, ton: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <section className="carte p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <ChampNombre
            label="Prix d’achat"
            valeur={v.prix}
            onChange={(x) => definir('prix', x)}
            suffixe="€"
            pas={5_000}
          />
          <ChampNombre
            label="Loyer mensuel attendu"
            valeur={v.loyer}
            onChange={(x) => definir('loyer', x)}
            suffixe="€"
            pas={25}
          />
          <ChampChoix
            label="Région"
            valeur={region}
            options={REGIONS.map((r) => ({ valeur: r, libelle: LIBELLE_REGION[r] }))}
            onChange={(x) => definir('region', x)}
            className="sm:col-span-2"
          />
          <ChampNombre
            label="Revenu cadastral"
            valeur={v.rc}
            onChange={(x) => definir('rc', x)}
            suffixe="€"
            pas={50}
            aide="Non indexé, tel qu’il figure sur l’avertissement-extrait de rôle."
          />
          <ChampNombre
            label="Ton taux marginal"
            valeur={v.marginal}
            onChange={(x) => definir('marginal', x)}
            suffixe="%"
            pas={5}
            aide="Les revenus immobiliers s’ajoutent à tes revenus globaux."
          />
          <ChampNombre
            label="Charges annuelles"
            valeur={v.charges}
            onChange={(x) => definir('charges', x)}
            suffixe="€"
            pas={100}
          />
          <ChampNombre
            label="Précompte immobilier"
            valeur={v.precompte}
            onChange={(x) => definir('precompte', x)}
            suffixe="€"
            pas={100}
          />
          <ChampNombre
            label="Vacance locative"
            valeur={v.vacance}
            onChange={(x) => definir('vacance', x)}
            suffixe="%"
            max={100}
          />
          <ChampNombre
            label="Provision travaux"
            valeur={v.travaux}
            onChange={(x) => definir('travaux', x)}
            suffixe="€"
            pas={250}
          />
          <ChampBascule
            label="Achat financé par un crédit"
            valeur={aCredit}
            onChange={(x) => definir('credit', x)}
          />
        </div>

        {aCredit && (
          <fieldset className="mt-5 grid gap-5 rounded-[var(--radius)] border border-border p-4 sm:grid-cols-3">
            <legend className="px-1.5 text-[12px] text-text-muted">Financement</legend>
            <ChampNombre
              label="Quotité empruntée"
              valeur={v.quotite}
              onChange={(x) => definir('quotite', x)}
              suffixe="%"
              max={100}
            />
            <ChampNombre
              label="Taux du crédit"
              valeur={v.taux}
              onChange={(x) => definir('taux', x)}
              suffixe="%"
              pas={0.1}
            />
            <ChampNombre
              label="Durée"
              valeur={v.duree}
              onChange={(x) => definir('duree', x)}
              suffixe="ans"
              max={40}
            />
          </fieldset>
        )}
      </section>

      <section className="carte p-5 sm:p-6">
        <p className="label-kpi">Cash-flow mensuel après impôt</p>
        <p
          className={`mt-2 chiffre-hero ${negatif ? 'text-negative' : 'text-positive'}`}
        >
          {formatEUR(result.cashFlowMensuelCents, { decimals: 0, sign: 'always' })}
        </p>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-text-muted">
          {negatif
            ? `Ce bien te coûterait ${formatEUR(result.effortMensuelCents, { decimals: 0 })} par mois. C’est un effort d’épargne, pas forcément un mauvais investissement — mais il faut pouvoir le porter tous les mois, pendant ${v.duree} ans.`
            : 'Ce bien s’autofinance et dégage un excédent, charges, impôt et crédit déduits.'}
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          {rendements.map((r) => (
            <div key={r.libelle}>
              <dt className="label-kpi">{r.libelle}</dt>
              <dd className={`mt-1.5 font-mono text-[18px] tabular-nums ${r.ton}`}>
                {formatPercent(r.valeur)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 space-y-2.5 border-t border-border pt-5 text-[14px]">
          {[
            { libelle: 'Investissement total, frais compris', valeur: result.investissementTotalCents },
            { libelle: 'dont frais d’acquisition', valeur: result.fraisAcquisitionCents, discret: true },
            { libelle: 'Base imposable (RC indexé majoré)', valeur: result.baseImposableCents, discret: true },
            { libelle: 'Impôt annuel', valeur: -result.impotAnnuelCents },
            ...(aCredit
              ? [{ libelle: 'Mensualité de crédit', valeur: -result.mensualiteCreditCents }]
              : []),
          ].map((ligne) => (
            <div key={ligne.libelle} className="flex items-baseline justify-between gap-3">
              <span className={ligne.discret ? 'text-[13px] text-text-subtle' : 'text-text-muted'}>
                {ligne.libelle}
              </span>
              <Montant
                cents={ligne.valeur}
                decimals={0}
                jamaisMasque
                className={ligne.discret ? 'text-[13px] text-text-subtle' : undefined}
              />
            </div>
          ))}
        </div>

        <p className="mt-5 rounded-[var(--radius)] border border-border bg-surface-2 p-3.5 text-[13px] leading-relaxed text-text-muted">
          <span className="font-medium text-text">Tu n’es pas taxé sur tes loyers.</span> En
          Belgique, un bien loué à un particulier est imposé sur le revenu cadastral indexé
          majoré de 40 %, pas sur ce que le locataire te verse. C’est presque toujours plus
          favorable — et c’est ce que les simulateurs français calculent faux.
        </p>
      </section>

      <PanneauExplication calcul={calcul} />
      <MentionInformative />
    </div>
  );
}
