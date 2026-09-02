import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Rafraîchit la session Supabase à chaque requête et protège les routes de
 * l'application authentifiée.
 *
 * Les Server Components ne peuvent pas écrire de cookie : sans ce middleware,
 * un jeton expiré ne serait jamais renouvelé et l'utilisateur serait déconnecté
 * sans raison apparente.
 *
 * Tant que Supabase n'est pas configuré, l'application tourne en mode démo et
 * le middleware laisse tout passer — sinon il serait impossible d'ouvrir l'app.
 */

/** Routes de l'application qui exigent une session une fois l'auth active. */
const ROUTES_PROTEGEES = [
  '/dashboard',
  '/patrimoine',
  '/budget',
  '/projections',
  '/objectifs',
  '/fiscalite',
  '/immobilier',
  '/parametres',
];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const modeDemoForce = process.env.NEXT_PUBLIC_MODE_DEMO === 'true';

  // Mode démo : aucune session à rafraîchir, aucune route à protéger.
  if (!url || !anon || modeDemoForce) {
    return NextResponse.next({ request });
  }

  let reponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesAEcrire) {
        for (const { name, value } of cookiesAEcrire) {
          request.cookies.set(name, value);
        }
        reponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesAEcrire) {
          reponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // `getUser()` et pas `getSession()` : seul le premier revalide le jeton
  // auprès de Supabase. Se fier au cookie seul serait une faille.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const chemin = request.nextUrl.pathname;
  const routeProtegee = ROUTES_PROTEGEES.some(
    (r) => chemin === r || chemin.startsWith(`${r}/`),
  );

  if (!user && routeProtegee) {
    const redirection = request.nextUrl.clone();
    redirection.pathname = '/connexion';
    // On mémorise la destination pour y revenir après connexion.
    redirection.searchParams.set('suite', chemin);
    return NextResponse.redirect(redirection);
  }

  // Déjà connecté : la page de connexion n'a plus de sens.
  if (user && chemin === '/connexion') {
    const redirection = request.nextUrl.clone();
    redirection.pathname = '/dashboard';
    redirection.search = '';
    return NextResponse.redirect(redirection);
  }

  return reponse;
}

export const config = {
  matcher: [
    /*
     * Tout sauf les fichiers statiques et les images : le middleware appelle
     * l'API Supabase, inutile de le faire tourner sur une police ou un favicon.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
