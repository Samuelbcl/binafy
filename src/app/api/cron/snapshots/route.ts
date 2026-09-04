import { NextResponse, type NextRequest } from 'next/server';
import { ecrireSnapshotsQuotidiens } from '@/lib/db/snapshots';
import { envServeur } from '@/lib/env';
import { supabaseConfigure } from '@/lib/env';

/**
 * Job quotidien d'instantanés (doc 03 § jobs).
 *
 * Déclenché par Vercel Cron. La route tourne avec la clé de service et
 * contourne donc la RLS : sans le secret partagé, n'importe qui pourrait la
 * déclencher et lire des totaux qui ne le regardent pas.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Comparaison à temps constant : une comparaison naïve fuit la longueur du
 * préfixe correct et permet de retrouver le secret octet par octet.
 */
function secretsEgaux(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

export async function GET(request: NextRequest) {
  const { CRON_SECRET } = envServeur();

  if (!CRON_SECRET) {
    return NextResponse.json(
      { erreur: 'CRON_SECRET absent : le job est désactivé.' },
      { status: 503 },
    );
  }

  const entete = request.headers.get('authorization') ?? '';
  const fourni = entete.startsWith('Bearer ') ? entete.slice(7) : '';

  if (!secretsEgaux(fourni, CRON_SECRET)) {
    // Pas de détail : on ne dit pas à un appelant non autorisé ce qui a échoué.
    return NextResponse.json({ erreur: 'Non autorisé.' }, { status: 401 });
  }

  if (!supabaseConfigure) {
    return NextResponse.json({ erreur: 'Supabase non configuré.' }, { status: 503 });
  }

  try {
    const resultat = await ecrireSnapshotsQuotidiens();
    return NextResponse.json(resultat, { status: 200 });
  } catch (erreur) {
    return NextResponse.json(
      { erreur: erreur instanceof Error ? erreur.message : 'Échec du job.' },
      { status: 500 },
    );
  }
}
