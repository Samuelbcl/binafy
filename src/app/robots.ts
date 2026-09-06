import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';

/**
 * L'application authentifiée et les routes techniques ne doivent jamais être
 * indexées : elles ne servent à rien dans un moteur de recherche, et une URL
 * de callback d'authentification indexée serait une mauvaise surprise.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/connexion',
          '/dashboard',
          '/patrimoine',
          '/budget',
          '/projections',
          '/objectifs',
          '/fiscalite',
          '/parametres',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
