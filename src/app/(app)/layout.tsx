import { AppShell } from '@/components/app/shell';
import { utilisateurCourant } from '@/lib/db/serveur';
import { modeDemo } from '@/lib/env';

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  // En mode démo il n'y a pas de session : le shell affiche le bandeau démo
  // plutôt qu'un compte. Le middleware garde les routes quand l'auth est active.
  const utilisateur = modeDemo ? null : await utilisateurCourant();

  return (
    <AppShell email={utilisateur?.email ?? null} modeDemo={modeDemo}>
      {children}
    </AppShell>
  );
}
