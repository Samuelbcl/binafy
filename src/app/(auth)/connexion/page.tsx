import type { Metadata } from 'next';
import Link from 'next/link';
import { FormulaireConnexion } from '@/components/auth/formulaire-connexion';
import { modeDemo } from '@/lib/env';
import { MarqueNestor } from '@/components/ui/marque';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Accéder à ton espace Nestor.',
  robots: { index: false, follow: false },
};

/** Erreurs que `/auth/callback` peut renvoyer ici. */
const MESSAGES_ERREUR: Record<string, string> = {
  lien_expire: 'Ce lien a expiré ou a déjà été utilisé. Demandes-en un nouveau.',
  lien_invalide: 'Ce lien est incomplet. Demandes-en un nouveau.',
};

export default async function ConnexionPage({ searchParams }: PageProps<'/connexion'>) {
  // Les paramètres sont lus côté serveur et passés en props : le formulaire est
  // ainsi rendu dans le HTML, sans squelette au chargement. La page est dynamique,
  // ce qui est sans conséquence — elle est en `noindex`.
  const params = await searchParams;

  const brut = params.suite;
  const demande = Array.isArray(brut) ? brut[0] : brut;
  // On ne redirige que vers un chemin interne.
  const suite =
    demande && demande.startsWith('/') && !demande.startsWith('//') ? demande : '/dashboard';

  const erreurBrute = params.erreur;
  const cleErreur = Array.isArray(erreurBrute) ? erreurBrute[0] : erreurBrute;
  const messageErreur = cleErreur ? (MESSAGES_ERREUR[cleErreur] ?? null) : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <MarqueNestor taille="grande" />
        </Link>

        <h1 className="titre-degrade mx-auto mt-8 text-center font-display text-[24px] tracking-tight">
          Connexion
        </h1>
        <p className="mt-2 text-center text-[14px] leading-relaxed text-text-muted">
          Un lien de connexion t’est envoyé par email. Pas de mot de passe à retenir.
        </p>

        <div className="mt-7">
          {modeDemo ? (
            <div className="carte space-y-3 p-5 text-center">
              <p className="text-[14px] leading-relaxed text-text-muted">
                L’application tourne en <span className="font-medium text-text">mode démo</span>,
                sur des données fictives. Aucun compte n’est nécessaire.
              </p>
              <Link
                href="/dashboard"
                className="bouton-principal"
              >
                Ouvrir la démo
              </Link>
              <p className="text-[11px] leading-relaxed text-text-subtle">
                Pour activer les comptes, renseigne les variables Supabase dans
                <code className="mx-1 text-text-muted">.env.local</code>.
              </p>
            </div>
          ) : (
            <FormulaireConnexion suite={suite} messageErreur={messageErreur} />
          )}
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-text-subtle">
          Données financières hébergées dans l’Union européenne, chiffrées au repos.
          Nestor n’accède jamais à tes comptes autrement qu’en lecture.
        </p>
      </div>
    </div>
  );
}
