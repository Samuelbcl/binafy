import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';
import { OUTILS } from '@/lib/outils';
import { GUIDES } from '@/lib/apprendre/guides';

/**
 * Sitemap (doc 09 § technique SEO).
 *
 * Derive des catalogues plutot que recopie : un outil ou un guide ajoute y entre
 * sans qu'on y pense. Seules les pages publiques y figurent — l'application
 * authentifiee n'a rien a faire dans un index de recherche.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const maintenant = new Date();

  const pages: { chemin: string; priorite: number; frequence: 'weekly' | 'monthly' | 'yearly' }[] = [
    { chemin: '', priorite: 1, frequence: 'weekly' },
    { chemin: '/apprendre', priorite: 0.9, frequence: 'weekly' },
    { chemin: '/outils', priorite: 0.9, frequence: 'weekly' },
    ...OUTILS.map((o) => ({ chemin: o.href, priorite: 0.9, frequence: 'monthly' as const })),
    ...GUIDES.map((g) => ({
      chemin: `/apprendre/${g.slug}`,
      priorite: 0.8,
      frequence: 'monthly' as const,
    })),
    { chemin: '/confidentialite', priorite: 0.3, frequence: 'yearly' },
    { chemin: '/conditions', priorite: 0.3, frequence: 'yearly' },
    { chemin: '/mentions-legales', priorite: 0.3, frequence: 'yearly' },
  ];

  return pages.map((page) => ({
    url: `${siteUrl}${page.chemin}`,
    lastModified: maintenant,
    changeFrequency: page.frequence,
    priority: page.priorite,
  }));
}
