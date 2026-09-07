import type { Metadata, Viewport } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { AppProviders } from '@/components/providers';
import { siteUrl } from '@/lib/env';
import './globals.css';

/**
 * L'interface et les chiffres — Plus Jakarta Sans (docs/05 § typographie).
 *
 * Elle tient le corps de texte, les libellés et les montants : ses chiffres
 * tabulaires alignent les colonnes sans qu'on charge une monospace pour ça.
 */
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

/**
 * Les titres — Fraunces.
 *
 * Une famille unique pour tout un écran le rend uniforme au mauvais sens : rien
 * ne distingue un titre d'un libellé, et la page se lit comme un formulaire.
 * Fraunces répond à Jakarta au lieu de la répéter — empattements taillés, axe
 * optique qui affine les grandes tailles, et l'axe WONK qui donne aux lettres
 * leur inflexion. Elle porte les h1 et h2, rien d'autre : au-delà, ce
 * caractère fatigue la lecture.
 *
 * Chargée en variable : `axes` et un poids fixe s'excluent chez next/font, et
 * les axes sont justement ce qu'on vient chercher. L'axe optique agit seul —
 * les navigateurs appliquent `font-optical-sizing: auto` par défaut, donc un
 * titre de 40 px reçoit un dessin plus fin qu'un titre de 17 px, sans une
 * ligne de code. Un seul fichier, en `swap` : le texte s'affiche avant.
 */
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Nestor — Le patrimoine, version belge',
    template: '%s · Nestor',
  },
  description:
    'Suivre, comprendre et piloter son patrimoine en Belgique : fiscalité belge intégrée à chaque calcul, et chaque chiffre s’explique.',
  applicationName: 'Nestor',
  authors: [{ name: 'Biancola Studio' }],
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'fr_BE',
    siteName: 'Nestor',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', images: ['/api/og'] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0B0A12' },
    { media: '(prefers-color-scheme: light)', color: '#F6F6F8' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="fr-BE"
      suppressHydrationWarning
      className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
