import type { Metadata } from 'next';
import Link from 'next/link';
import { DonneesPersonnelles } from '@/components/parametres/donnees-personnelles';
import { utilisateurCourant } from '@/lib/db/serveur';
import { resumerDonnees } from '@/lib/db/rgpd';
import { PROFIL_DEMO } from '@/lib/demo/donnees';
import { modeDemo } from '@/lib/env';
import { parametresNonVerifies, TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import { LIBELLE_REGION } from '@/lib/tax/types';

export const metadata: Metadata = {
  title: 'Paramètres',
  description: 'Profil, Région fiscale, données personnelles.',
};

export default async function ParametresPage() {
  const params = TAX_PARAMS_2026;
  const nonVerifies = parametresNonVerifies(params);

  const utilisateur = modeDemo ? null : await utilisateurCourant();
  const resume = utilisateur ? await resumerDonnees() : null;

  const lignes = [
    { label: 'Compte', valeur: utilisateur?.email ?? 'Mode démo' },
    { label: 'Prénom', valeur: PROFIL_DEMO.prenom },
    { label: 'Région fiscale', valeur: LIBELLE_REGION[PROFIL_DEMO.region] },
    { label: 'Commune', valeur: PROFIL_DEMO.commune },
    {
      label: 'Additionnels communaux',
      valeur: `${PROFIL_DEMO.additionnelsCommunauxPourcent} %`,
    },
    { label: 'Statut professionnel', valeur: 'Salarié' },
    { label: 'Langue', valeur: 'Français (Belgique)' },
    { label: 'Devise', valeur: 'EUR' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight">Paramètres</h1>
        <p className="mt-1.5 text-[14px] text-text-muted">
          Ton profil détermine les taux appliqués dans tous les calculs.
        </p>
      </header>

      <section className="carte overflow-hidden">
        <h2 className="px-5 py-4 font-display text-[17px] font-semibold sm:px-6">Profil</h2>
        <dl className="border-t border-border">
          {lignes.map((ligne) => (
            <div
              key={ligne.label}
              className="flex items-center justify-between gap-4 border-b border-border/40 px-5 py-3 last:border-0 sm:px-6"
            >
              <dt className="text-[14px] text-text-muted">{ligne.label}</dt>
              <dd className="text-[14px]">{ligne.valeur}</dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-border px-5 py-3 text-[11px] leading-relaxed text-text-subtle sm:px-6">
          La modification du profil arrive avec le module fiscal personnalisé. Les additionnels
          communaux varient fortement d’une commune à l’autre : c’est le paramètre qui change le
          plus ton taux marginal.
        </p>
      </section>

      <section className="carte p-5 sm:p-6">
        <h2 className="font-display text-[17px] font-semibold">Données fiscales</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
          {params.parametres.length} paramètres chargés pour l’année {params.annee}. Chacun porte
          sa source officielle et sa date de vérification : mettre à jour un taux est une
          insertion de données, pas un déploiement.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-text-muted">
          <span className="font-medium text-warning">{nonVerifies.length} paramètres</span>{' '}
          attendent une confirmation à la source officielle. Tout calcul qui en dépend
          l’affiche.
        </p>
      </section>

      {utilisateur && resume ? (
        <DonneesPersonnelles resume={resume} />
      ) : (
        <section className="carte p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Données personnelles</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
            Cette instance tourne en mode démo sur des données fictives. Aucune donnée réelle
            n’est stockée. L’export complet et la suppression du compte sont disponibles dès
            qu’une session existe.
          </p>
        </section>
      )}

      <section className="carte p-5 sm:p-6">
        <h2 className="font-display text-[17px] font-semibold">Documents</h2>
        <ul className="mt-3 space-y-2 text-[14px]">
          {[
            { href: '/confidentialite', libelle: 'Politique de confidentialité' },
            { href: '/conditions', libelle: 'Conditions d’utilisation' },
            { href: '/mentions-legales', libelle: 'Mentions légales' },
          ].map((lien) => (
            <li key={lien.href}>
              <Link
                href={lien.href}
                className="text-text-muted underline underline-offset-2 transition-colors hover:text-primary"
              >
                {lien.libelle}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
