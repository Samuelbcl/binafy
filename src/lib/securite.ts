/**
 * Limitation de débit (doc 03 § sécurité).
 *
 * Implémentation en mémoire, volontairement simple. Elle protège l'essentiel :
 * l'envoi de liens de connexion et l'import de fichiers, les deux points où un
 * abus coûte cher — quota d'emails brûlé d'un côté, temps de calcul de l'autre.
 *
 * Limite connue : sur plusieurs instances serverless, chacune a son propre
 * compteur, donc la limite réelle est multipliée par le nombre d'instances
 * actives. C'est suffisant contre un script naïf, pas contre une attaque
 * distribuée. Le passage à un compteur partagé (Upstash) est le prochain pas,
 * et il ne changera que l'implémentation de `consommer()`.
 */

type Compteur = { restant: number; reinitialiseA: number };

const compteurs = new Map<string, Compteur>();

/** Purge les entrées expirées pour que la table ne grossisse pas indéfiniment. */
function purger(maintenant: number) {
  if (compteurs.size < 1000) return;
  for (const [cle, compteur] of compteurs) {
    if (compteur.reinitialiseA <= maintenant) compteurs.delete(cle);
  }
}

export type ResultatLimite = {
  autorise: boolean;
  restant: number;
  /** Secondes avant réinitialisation, pour l'en-tête `Retry-After`. */
  reessayerDans: number;
};

export function consommer(
  cle: string,
  maximum: number,
  fenetreSecondes: number,
  maintenant = Date.now(),
): ResultatLimite {
  purger(maintenant);

  const existant = compteurs.get(cle);

  if (!existant || existant.reinitialiseA <= maintenant) {
    const reinitialiseA = maintenant + fenetreSecondes * 1000;
    compteurs.set(cle, { restant: maximum - 1, reinitialiseA });
    return { autorise: true, restant: maximum - 1, reessayerDans: fenetreSecondes };
  }

  const reessayerDans = Math.ceil((existant.reinitialiseA - maintenant) / 1000);

  if (existant.restant <= 0) {
    return { autorise: false, restant: 0, reessayerDans };
  }

  existant.restant--;
  return { autorise: true, restant: existant.restant, reessayerDans };
}

/**
 * Identifie l'appelant.
 *
 * Sur Vercel, `x-forwarded-for` est posé par la plateforme et n'est pas
 * falsifiable par le client. Ailleurs, il pourrait l'être : la limitation par
 * IP est une gêne pour les abus courants, jamais une barrière d'authentification.
 */
export function identifierAppelant(entetes: Headers): string {
  const transmis = entetes.get('x-forwarded-for');
  if (transmis) {
    const premiere = transmis.split(',')[0]?.trim();
    if (premiere) return premiere;
  }
  return entetes.get('x-real-ip') ?? 'inconnu';
}

/** Vide les compteurs — réservé aux tests. */
export function reinitialiserLimites() {
  compteurs.clear();
}

/**
 * Politique de sécurité de contenu.
 *
 * **Pas de nonce, et c'est délibéré.** Un nonce doit être différent à chaque
 * requête, or la majorité des pages de Nestor sont prérendues au build : leur
 * HTML est figé, le nonce qu'il contiendrait ne correspondrait jamais à celui
 * de l'en-tête, et tous les scripts seraient bloqués. Vérifié : avec un nonce,
 * les 14 balises `<script>` de la page d'accueil étaient rejetées.
 *
 * L'alternative — rendre toute l'application dynamique — coûterait le
 * prérendu des pages publiques, qui portent le référencement. Le compromis
 * retenu garde `'unsafe-inline'` sur les seuls scripts et verrouille tout le
 * reste : aucune origine externe, pas d'encadrement, pas d'objet, pas de
 * `base` réécrite, connexions limitées à Supabase.
 *
 * Ce que cela ne protège pas : une injection de script inline dans une page.
 * Le rempart contre ce risque est ailleurs — React échappe par défaut tout ce
 * qu'il rend, et aucun `dangerouslySetInnerHTML` n'existe dans le projet.
 */
export function construireCSP(developpement: boolean): string {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const origineSupabase = supabase ? new URL(supabase).origin : '';
  const wsSupabase = origineSupabase ? origineSupabase.replace(/^https/, 'wss') : '';

  const directives = [
    "default-src 'self'",
    // `unsafe-eval` est nécessaire au rafraîchissement à chaud en développement,
    // et ne doit jamais atteindre la production.
    developpement
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${origineSupabase} ${wsSupabase}`.trim(),
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ];

  return directives.filter(Boolean).join('; ');
}
