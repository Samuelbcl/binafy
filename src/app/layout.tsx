import type { Metadata, Viewport } from 'next';
import { Nunito_Sans } from 'next/font/google';
import { AppProviders } from '@/components/providers';
import { siteUrl } from '@/lib/env';
import './globals.css';

/**
 * Une seule famille — Nunito Sans.
 *
 * Samuel veut « une police comme Revolut ». Revolut ecrit en Aeonik Pro, une
 * police commerciale (CoType Foundry) : un grotesque a base geometrique,
 * chaleureux, aux terminaisons un peu adoucies. Parmi les polices libres,
 * Nunito Sans est celle que les comparateurs placent le plus pres (75 % de
 * proximite, devant DM Sans et Inter) : memes proportions ouvertes, meme
 * rondeur retenue, sans les bouts arrondis de Nunito. Variable, de 200 a 1000.
 * Une seule famille pour tout, titres compris : les titres se distinguent par
 * la taille et le gras, pas par une seconde voix.
 *
 * Si Samuel veut l'original, Aeonik Pro se licencie chez CoType et se monte
 * en `next/font/local` sans rien changer d'autre.
 */
const ui = Nunito_Sans({
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
