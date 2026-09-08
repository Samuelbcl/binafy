import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Schibsted_Grotesk } from 'next/font/google';
import { AppProviders } from '@/components/providers';
import { siteUrl } from '@/lib/env';
import './globals.css';

/**
 * L'interface et les chiffres — Schibsted Grotesk.
 *
 * Un grotesque dessiné pour la presse, pas pour les maquettes : le a, le g et
 * le y ont une inflexion qu'on ne trouve pas dans les sans « neutres » que tout
 * le monde emploie, et ses chiffres tiennent une colonne. C'est ce qui manquait
 * à l'ancienne police : elle ne disait rien, et on le voyait.
 */
const ui = Schibsted_Grotesk({
  variable: '--font-ui',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Les titres — Instrument Serif.
 *
 * Un serif a fort contraste, etroit, presque calligraphique : c'est la voix
 * des maquettes que Samuel a apportees — le « Good morning ! » en serif au-
 * dessus d'une interface en grotesque. Une seule graisse, jamais synthetisee
 * en gras ; la hierarchie vient de la taille. L'italique existe, pour un mot
 * qu'on veut faire entendre.
 */
const titres = Instrument_Serif({
  variable: '--font-titres',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
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
      className={`${ui.variable} ${titres.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
