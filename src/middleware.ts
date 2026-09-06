import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { construireCSP, consommer, identifierAppelant } from '@/lib/securite';

/**
 * Rafraîchit la session Supabase, protège les routes de l'application, applique
 * la politique de sécurité de contenu et limite les points coûteux.
 *
 * Les Server Components ne peuvent pas écrire de cookie : sans ce middleware,
 * un jeton expiré ne serait jamais renouvelé et l'utilisateur serait déconnecté
 * sans raison apparente.
 *
 * Tant que Supabase n'est pas configuré, l'application tourne en mode démo et
 * aucune route n'est protégée — sinon il serait impossible d'ouvrir l'app.
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

/**
 * Points où un abus coûte cher : l'envoi de liens de connexion brûle un quota
 * d'emails, l'export mobilise la base sur toutes les tables.
 */
const LIMITES = [
  { prefixe: '/auth/callback', maximum: 20, fenetre: 300 },
  { prefixe: '/api/rgpd/export', maximum: 5, fenetre: 3600 },
];

export async function middleware(request: NextRequest) {
  const chemin = request.nextUrl.pathname;

  // ── Limitation de débit ────────────────────────────────────
  const appelant = identifierAppelant(request.headers);

  for (const limite of LIMITES) {
    if (!chemin.startsWith(limite.prefixe)) continue;

    const resultat = consommer(`${limite.prefixe}:${appelant}`, limite.maximum, limite.fenetre);
    if (!resultat.autorise) {
      return new NextResponse('Trop de requêtes. Réessaie dans un instant.', {
        status: 429,
        headers: { 'Retry-After': String(resultat.reessayerDans) },
      });
    }
  }

  // ── Politique de sécurité de contenu ───────────────────────
  // Voir `construireCSP` : pas de nonce, les pages étant prérendues.
  const csp = construireCSP(process.env.NODE_ENV !== 'production');

  const suivant = () => {
    const reponse = NextResponse.next({ request });
    reponse.headers.set('Content-Security-Policy', csp);
    return reponse;
  };

  const rediriger = (destination: URL) => {
    const reponse = NextResponse.redirect(destination);
    reponse.headers.set('Content-Security-Policy', csp);
    return reponse;
  };

  // ── Session ────────────────────────────────────────────────
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const modeDemoForce = process.env.NEXT_PUBLIC_MODE_DEMO === 'true';

  // Mode démo : aucune session à rafraîchir, aucune route à protéger.
  if (!url || !anon || modeDemoForce) return suivant();

  let reponse = suivant();

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesAEcrire) {
        for (const { name, value } of cookiesAEcrire) {
          request.cookies.set(name, value);
        }
        reponse = suivant();
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

  const routeProtegee = ROUTES_PROTEGEES.some(
    (r) => chemin === r || chemin.startsWith(`${r}/`),
  );

  if (!user && routeProtegee) {
    const redirection = request.nextUrl.clone();
    redirection.pathname = '/connexion';
    // On mémorise la destination pour y revenir après connexion.
    redirection.searchParams.set('suite', chemin);
    return rediriger(redirection);
  }

  // Déjà connecté : la page de connexion n'a plus de sens.
  if (user && chemin === '/connexion') {
    const redirection = request.nextUrl.clone();
    redirection.pathname = '/dashboard';
    redirection.search = '';
    return rediriger(redirection);
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
