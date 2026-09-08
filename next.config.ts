import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Le disque « N » de Next recouvre l'onglet Accueil sur chaque capture : on
  // jugerait un element qui n'existe pas en production.
  devIndicators: false,

  // Le dossier parent contient d'autres projets : on ancre Turbopack sur celui-ci,
  // sinon il remonte et ramasse un package-lock.json qui n'est pas le nôtre.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },

  // En-têtes de sécurité (doc 03 § sécurité). La CSP stricte viendra avec l'auth,
  // quand on saura quels domaines externes sont réellement appelés.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
