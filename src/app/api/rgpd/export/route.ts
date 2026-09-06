import { NextResponse } from 'next/server';
import { exporterDonnees } from '@/lib/db/rgpd';

/**
 * Téléchargement de l'export RGPD.
 *
 * Passe par une route plutôt qu'une Server Action : un fichier de plusieurs
 * mégaoctets n'a pas à transiter par le protocole des actions, et le navigateur
 * sait déclencher un téléchargement à partir d'une réponse HTTP.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const donnees = await exporterDonnees();

  if (!donnees) {
    return NextResponse.json({ erreur: 'Non authentifié.' }, { status: 401 });
  }

  const horodatage = new Date().toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(donnees, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="nestor-export-${horodatage}.json"`,
      // Un export de données financières ne doit jamais être mis en cache,
      // ni par le navigateur ni par un intermédiaire.
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    },
  });
}
