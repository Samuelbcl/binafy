import { z } from 'zod';

/**
 * Variables d'environnement, validées avec Zod (CLAUDE.md § règles de code).
 *
 * Deux principes :
 *
 *  1. **Tout est optionnel.** Sans Supabase, l'application démarre en mode démo
 *     sur des données fictives. On ne veut pas qu'un `.env.local` incomplet
 *     empêche d'ouvrir l'app — c'est le meilleur moyen de ne jamais la lancer.
 *
 *  2. **Les secrets serveur ne fuient pas.** `envServeur` lève si on l'appelle
 *     depuis un Client Component. Seules les variables `NEXT_PUBLIC_` sont
 *     lisibles côté navigateur, et aucune d'elles n'est un secret.
 *
 * Les variables `NEXT_PUBLIC_` sont référencées littéralement : Next les inline
 * au build, un accès dynamique (`process.env[cle]`) ne fonctionnerait pas.
 */

/**
 * URL tolérante au protocole manquant.
 *
 * Coller « binafy.vercel.app » plutôt que « https://binafy.vercel.app » est
 * l'erreur la plus courante, et elle empêchait l'application de démarrer avec
 * un message qui ne disait pas quoi faire. On complète en `https://` plutôt
 * que de refuser : le domaine seul n'est jamais ambigu.
 */
const urlOptionnelle = z
  .string()
  .transform((v) => {
    const t = v.trim();
    if (t === '' || /^https?:\/\//i.test(t)) return t;
    return `https://${t}`;
  })
  .refine((v) => v === '' || z.string().url().safeParse(v).success, {
    message: 'URL invalide — attendu par exemple https://nestor.be',
  })
  .optional();
const texteOptionnel = z.string().min(1).or(z.literal('')).optional();

// ── Client ───────────────────────────────────────────────────
const schemaClient = z.object({
  NEXT_PUBLIC_SITE_URL: urlOptionnelle,
  NEXT_PUBLIC_SUPABASE_URL: urlOptionnelle,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: texteOptionnel,
  NEXT_PUBLIC_MODE_DEMO: z.enum(['true', 'false']).optional(),
});

const resultatClient = schemaClient.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MODE_DEMO: process.env.NEXT_PUBLIC_MODE_DEMO,
});

if (!resultatClient.success) {
  // Une variable publique mal formée est une erreur de configuration visible :
  // on préfère échouer au démarrage plutôt qu'à la première requête.
  throw new Error(
    `Variables d'environnement publiques invalides :\n${resultatClient.error.issues
      .map((i) => `  · ${i.path.join('.')} — ${i.message}`)
      .join('\n')}`,
  );
}

export const envClient = resultatClient.data;

/**
 * URL publique du site, sans barre oblique finale.
 *
 * Elle sert de base aux images de partage, au sitemap et aux liens des emails :
 * une barre en trop y produirait des `//` visibles dans les URL partagées.
 */
export const siteUrl = (envClient.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

/** Vrai quand Supabase est configuré et utilisable côté client. */
export const supabaseConfigure =
  Boolean(envClient.NEXT_PUBLIC_SUPABASE_URL) && Boolean(envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Vrai quand l'application tourne sur des données fictives.
 * Soit parce que Supabase n'est pas configuré, soit parce qu'on le force
 * (utile pour les captures et les démos).
 */
export const modeDemo = !supabaseConfigure || envClient.NEXT_PUBLIC_MODE_DEMO === 'true';

// ── Serveur ──────────────────────────────────────────────────
const schemaServeur = z.object({
  SUPABASE_SERVICE_ROLE_KEY: texteOptionnel,
  ENCRYPTION_KEY: texteOptionnel,
  GOCARDLESS_SECRET_ID: texteOptionnel,
  GOCARDLESS_SECRET_KEY: texteOptionnel,
  PONTO_CLIENT_ID: texteOptionnel,
  PONTO_CLIENT_SECRET: texteOptionnel,
  EODHD_API_KEY: texteOptionnel,
  TWELVE_DATA_API_KEY: texteOptionnel,
  COINGECKO_API_KEY: texteOptionnel,
  RESEND_API_KEY: texteOptionnel,
  RESEND_FROM: texteOptionnel,
  CRON_SECRET: texteOptionnel,
});

export type EnvServeur = z.infer<typeof schemaServeur>;

let cacheServeur: EnvServeur | null = null;

/**
 * Variables serveur. À n'appeler que depuis un Server Component, une Route
 * Handler, une Server Action ou un job.
 *
 * Ces valeurs ne doivent jamais atteindre le navigateur : un token d'agrégation
 * bancaire côté client est une fuite, pas un bug d'affichage.
 */
export function envServeur(): EnvServeur {
  if (typeof window !== 'undefined') {
    throw new Error(
      "envServeur() a été appelé côté client. Les secrets serveur ne doivent jamais " +
        'atteindre le navigateur — passe la valeur en prop depuis un Server Component.',
    );
  }

  if (cacheServeur) return cacheServeur;

  const resultat = schemaServeur.safeParse(process.env);
  if (!resultat.success) {
    throw new Error(
      `Variables d'environnement serveur invalides :\n${resultat.error.issues
        .map((i) => `  · ${i.path.join('.')} — ${i.message}`)
        .join('\n')}`,
    );
  }

  cacheServeur = resultat.data;
  return cacheServeur;
}

/**
 * Exige une variable serveur, avec un message qui dit quoi faire.
 * À utiliser au point d'usage, jamais au chargement du module : une clé
 * manquante ne doit casser que la fonctionnalité concernée.
 */
export function exigerEnv(cle: keyof EnvServeur): string {
  const valeur = envServeur()[cle];
  if (!valeur) {
    throw new Error(
      `${cle} est absente. Ajoute-la dans .env.local — voir .env.example pour le détail.`,
    );
  }
  return valeur;
}
