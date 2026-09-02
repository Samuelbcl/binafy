import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServeur } from '@/lib/db/serveur';
import { supabaseConfigure } from '@/lib/env';

/**
 * Point d'atterrissage du lien magique.
 *
 * Supabase renvoie un code à usage unique dans la query string ; on l'échange
 * contre une session, que le client SSR pose en cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');

  // On ne redirige que vers un chemin interne : une URL absolue fournie par
  // l'appelant serait une redirection ouverte.
  const suiteBrute = searchParams.get('suite') ?? '/dashboard';
  const suite = suiteBrute.startsWith('/') && !suiteBrute.startsWith('//')
    ? suiteBrute
    : '/dashboard';

  if (!supabaseConfigure) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien_invalide`);
  }

  const supabase = await supabaseServeur();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Lien déjà utilisé ou expiré : on le dit sans détail technique.
    return NextResponse.redirect(`${origin}/connexion?erreur=lien_expire`);
  }

  return NextResponse.redirect(`${origin}${suite}`);
}
