import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { envClient, envServeur, exigerEnv, supabaseConfigure } from '@/lib/env';
import type { Database } from './types';

/**
 * Clients Supabase côté serveur.
 *
 * `supabaseServeur()` respecte la RLS et agit au nom de l'utilisateur connecté.
 * `supabaseAdmin()` la contourne : réservé aux jobs, jamais à une requête
 * déclenchée par un utilisateur.
 */

function exigerConfiguration() {
  if (!supabaseConfigure) {
    throw new Error(
      "Supabase n'est pas configuré. Renseigne NEXT_PUBLIC_SUPABASE_URL et " +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local, ou reste en mode démo.',
    );
  }
}

/**
 * Client authentifié pour Server Components, Route Handlers et Server Actions.
 * La session vit dans les cookies ; la RLS fait le reste.
 */
export async function supabaseServeur() {
  exigerConfiguration();
  const magasin = await cookies();

  return createServerClient<Database>(
    envClient.NEXT_PUBLIC_SUPABASE_URL!,
    envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return magasin.getAll();
        },
        setAll(cookiesAEcrire) {
          try {
            for (const { name, value, options } of cookiesAEcrire) {
              magasin.set(name, value, options);
            }
          } catch {
            // Un Server Component ne peut pas écrire de cookie. Le middleware
            // rafraîchit la session, donc on peut ignorer sans risque.
          }
        },
      },
    },
  );
}

/**
 * Client `service_role` — contourne la RLS.
 *
 * ⚠️ À n'utiliser que dans les jobs planifiés (snapshots quotidiens, cotations,
 * seed fiscal). Jamais dans une route qui répond à un utilisateur : ce serait
 * rouvrir toutes les données de tout le monde.
 */
export function supabaseAdmin() {
  exigerConfiguration();

  return createClient<Database>(
    envClient.NEXT_PUBLIC_SUPABASE_URL!,
    exigerEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

/** Utilisateur connecté, ou `null`. Ne lève jamais : le mode démo n'a pas de session. */
export async function utilisateurCourant() {
  if (!supabaseConfigure) return null;

  const supabase = await supabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/** Vrai si les jobs planifiés peuvent tourner (clé de service présente). */
export function jobsConfigures(): boolean {
  return supabaseConfigure && Boolean(envServeur().SUPABASE_SERVICE_ROLE_KEY);
}
