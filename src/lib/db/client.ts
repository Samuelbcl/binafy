'use client';

import { createBrowserClient } from '@supabase/ssr';
import { envClient, supabaseConfigure } from '@/lib/env';

/**
 * Client Supabase pour les Client Components.
 *
 * Utilise la clé `anon` : toutes les requêtes passent par la RLS, qui est la
 * seule barrière de sécurité. Une table sans policy est une table publique.
 */

let cache: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseNavigateur() {
  if (!supabaseConfigure) {
    throw new Error(
      "Supabase n'est pas configuré. Renseigne NEXT_PUBLIC_SUPABASE_URL et " +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local, ou reste en mode démo.',
    );
  }

  // Un seul client par onglet : en recréer un à chaque rendu casse la session
  // et multiplie les connexions temps réel.
  cache ??= createBrowserClient(
    envClient.NEXT_PUBLIC_SUPABASE_URL!,
    envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return cache;
}
