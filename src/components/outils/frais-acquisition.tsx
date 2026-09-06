'use client';

import { useMemo } from 'react';
import { ChampBascule, ChampChoix, ChampNombre } from '@/components/ui/champs';
import { Montant } from '@/components/ui/montant';
import {
  MentionInformative,
  PanneauExplication,
} from '@/components/ui/panneau-explication';
import { useEtatUrl } from '@/lib/use-etat-url';
import { euros, formatEUR } from '@/lib/money';
import {
  calculerCashNecessaire,
  coutOrdreAchat,
  LIBELLE_TYPE_ACHAT,
  type TypeAchat,
} from '@/lib/tax/enregistrement';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import { LIBELLE_REGION, REGIONS, type RegionFiscale } from '@/lib/tax/types';

/**
 * Calculateur de frais d'acquisition (doc 02 § module 4, doc 09).
 *
 * L'état vit dans la query string : un lien partagé rejoue exactement la
 * simulation. C'est ce qui fait circuler l'outil sur Reddit et dans les groupes
 * Facebook belges, et c'est excellent pour le SEO.
 */

export type ValeursAcquisition = {
  prix: number;
  rp: number;
  region: RegionFiscale;
  type: TypeAchat;
  neuf: boolean;
};

export function OutilFraisAcquisition({ initiales }: { initiales: ValeursAcquisition }) {
  const [v, definir] = useEtatUrl(initiales);
  const { prix, region, neuf } = v;
  const typeAchat = v.type;
  const prixRP = v.rp;

  const cash = useMemo(
    () =>
      calculerCashNecessaire(
        { prixCents: euros(prix), region, typeAchat, neuf },
        TAX_PARAMS_2026,
      ),
    [prix, region, typeAchat, neuf],
  );

  const arbitrage = useMemo(
    () =>
      coutOrdreAchat(
        {
          prixLocatifEnvisageCents: euros(prix),
          prixResidencePrincipaleFutureCents: euros(prixRP),
          region,
        },
        TAX_PARAMS_2026,
      ),
    [prix, prixRP, region],
  );

  const postes = [
    { libelle: 'Droits d’enregistrement', valeur: cash.result.droitsCents },
    { libelle: 'Honoraires du notaire', valeur: cash.result.honorairesNotaireCents },
    { libelle: 'Frais et débours', valeur: cash.result.fraisDeboursCents },
    { libelle: 'Acte de crédit', valeur: cash.result.acteCreditCents },
    { libelle: 'Frais de dossier', valeur: cash.result.fraisDossierCents },
    { libelle: 'Apport propre', valeur: cash.result.apportCents },
  ];

  return (
    <div className="space-y-6">
      <section className="carte p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <ChampNombre
            label="Prix d’achat"
            valeur={prix}
            onChange={(x) => definir('prix', x)}
            suffixe="€"
            pas={5_000}
            min={0}
          />
          <ChampChoix
            label="Région"
            valeur={region}
            options={REGIONS.map((r) => ({ valeur: r, libelle: LIBELLE_REGION[r] }))}
            onChange={(x) => definir('region', x)}
          />
          <ChampChoix
            label="Type d’achat"
            valeur={typeAchat}
            options={(['propre_unique', 'autre', 'locatif'] as const).map((t) => ({
              valeur: t,
              libelle: LIBELLE_TYPE_ACHAT[t],
            }))}
            onChange={(x) => definir('type', x)}
            className="sm:col-span-2"
            aide="Le taux réduit ne vaut que pour une habitation propre et unique, avec des conditions de résidence."
          />
          <ChampBascule
            label="Bien neuf (vendu sous régime TVA)"
            valeur={neuf}
            onChange={(x) => definir('neuf', x)}
            aide="La TVA de 21 % remplace alors les droits d’enregistrement."
          />
        </div>
      </section>

      <section className="carte p-5 sm:p-6">
        <p className="label-kpi">Cash nécessaire le jour de l’acte</p>
        <p className="mt-2 chiffre-hero text-primary">
          <Montant cents={cash.result.cashTotalCents} decimals={0} jamaisMasque />
        </p>
        <p className="mt-2 text-[13px] text-text-muted">
          dont <Montant cents={cash.result.apportCents} decimals={0} jamaisMasque /> d’apport
          propre, la banque finançant {Math.round(cash.result.quotiteAppliquee * 100)} % du prix.
        </p>

        <ul className="mt-6 space-y-2.5">
          {postes.map((poste) => {
            const part =
              cash.result.cashTotalCents > 0 ? poste.valeur / cash.result.cashTotalCents : 0;
            return (
              <li key={poste.libelle}>
                <div className="flex items-baseline justify-between gap-3 text-[14px]">
                  <span className="text-text-muted">{poste.libelle}</span>
                  <Montant cents={poste.valeur} decimals={0} jamaisMasque />
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${Math.max(1, part * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4 text-[15px] font-medium">
          <span>Montant emprunté</span>
          <Montant cents={cash.result.montantEmprunteCents} decimals={0} jamaisMasque />
        </div>
      </section>

      <PanneauExplication calcul={cash} />

      {/* L'arbitrage : le calcul qui justifie l'app pour la cible. */}
      {arbitrage.result.surcoutDroitsCents > 0 && (
        <section className="carte border-warning/30 p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">
            Et si tu achetais ce locatif avant ta résidence principale ?
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-text-muted">
            Détenir un autre immeuble d’habitation à la date de l’acte fait perdre le taux
            réduit sur l’achat suivant. Voici ce que cet ordre d’achat coûterait.
          </p>

          <div className="mt-5 max-w-xs">
            <ChampNombre
              label="Prix de ta future résidence principale"
              valeur={prixRP}
              onChange={(x) => definir('rp', x)}
              suffixe="€"
              pas={5_000}
            />
          </div>

          <p className="mt-5 font-display text-[32px] font-semibold text-warning tabular-nums">
            {formatEUR(arbitrage.result.surcoutDroitsCents, { decimals: 0 })}
          </p>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-text-muted">
            {arbitrage.result.explication}
          </p>

          <div className="mt-4">
            <PanneauExplication calcul={arbitrage} titre="Le détail de l’écart" />
          </div>
        </section>
      )}

      <MentionInformative />
    </div>
  );
}
