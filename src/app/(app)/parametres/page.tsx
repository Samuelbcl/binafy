import type { Metadata } from 'next';
import { PROFIL_DEMO } from '@/lib/demo/donnees';
import { parametresNonVerifies, TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import { LIBELLE_REGION } from '@/lib/tax/types';

export const metadata: Metadata = {
  title: 'Paramètres',
  description: 'Profil, Région fiscale et état des données.',
};

export default function ParametresPage() {
  const params = TAX_PARAMS_2026;
  const nonVerifies = parametresNonVerifies(params);

  const lignes = [
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
          attendent encore une confirmation à la source. Tout calcul qui en dépend l’affiche.
        </p>
      </section>

      <section className="carte p-5 sm:p-6">
        <h2 className="font-display text-[17px] font-semibold">Données personnelles</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
          Cette instance tourne en mode démo sur des données fictives. Aucune donnée réelle
          n’est stockée, aucune connexion bancaire n’est active. L’export complet et la
          suppression du compte seront implémentés en même temps que la persistance, pas
          rajoutés après.
        </p>
      </section>
    </div>
  );
}
