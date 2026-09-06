import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';

/**
 * Sitemap (doc 09 § technique SEO).
 *
 * Seules les pages publiques y figurent : l'application authentifiée n'a rien
 * à faire dans un index de recherche.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const maintenant = new Date();

  const pages: { chemin: string; priorite: number; frequence: 'weekly' | 'monthly' | 'yearly' }[] = [
    { chemin: '', priorite: 1, frequence: 'weekly' },
    { chemin: '/outils/frais-acquisition', priorite: 0.9, frequence: 'monthly' },
    { chemin: '/outils/interets-composes', priorite: 0.9, frequence: 'monthly' },
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
