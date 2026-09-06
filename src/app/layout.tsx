import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, JetBrains_Mono, Manrope } from 'next/font/google';
import { AppProviders } from '@/components/providers';
import { siteUrl } from '@/lib/env';
import './globals.css';

/** Display — titres et chiffres héros. */
const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

/** Interface — corps, navigation, formulaires. */
const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

/** Chiffres — tous les montants en tableau. */
const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500'],
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
    { media: '(prefers-color-scheme: dark)', color: '#0B0D10' },
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="fr-BE"
      suppressHydrationWarning
      className={`${bricolage.variable} ${manrope.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
