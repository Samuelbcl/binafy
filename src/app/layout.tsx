import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next } from 'next/font/google';
import { AppProviders } from '@/components/providers';
import { siteUrl } from '@/lib/env';
import './globals.css';

/**
 * Une seule famille — Atkinson Hyperlegible Next.
 *
 * Dessinee par le Braille Institute pour des gens qui ont du mal a lire :
 * chaque lettre est faite pour ne pas etre confondue avec une autre (le l, le
 * I et le 1 ; le b et le d ; le O et le 0). C'est le test qu'on a rate — la
 * mere de Samuel n'a rien compris — et c'est la police qui a ete faite pour
 * le passer. Sept graisses, variable, republiee sur Google Fonts en 2025.
 * Une seule famille pour tout, titres compris : les titres se distinguent par
 * la taille et le gras, pas par une autre voix. Moins de choses a lire.
 */
const ui = Atkinson_Hyperlegible_Next({
  variable: '--font-ui',
  subsets: ['latin'],
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
  // Le clair est le défaut quel que soit le réglage du système : la barre du
  // navigateur suit donc le fond de l'application, pas la préférence du
  // téléphone.
  themeColor: '#F3F0FA',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="fr-BE"
      suppressHydrationWarning
      className={`${ui.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
