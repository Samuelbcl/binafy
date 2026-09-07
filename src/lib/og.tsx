import { ImageResponse } from 'next/og';

/**
 * Images de partage (doc 09 § technique SEO).
 *
 * « Un lien de partage d'une simulation doit générer une OG image avec les
 * chiffres : c'est ce qui fait circuler l'outil sur Reddit et dans les groupes
 * Facebook belges. »
 *
 * Le chiffre est donc le sujet de l'image, pas un logo. Une carte qui montre
 * « 26 600 € » se partage ; une carte qui montre un nom de marque, non.
 *
 * Le fond reprend l'accent de la carte principale du tableau de bord : sur un
 * fil d'actualité, un aplat coloré se repère où une carte sombre se confond
 * avec le reste.
 *
 * Contrainte technique : `ImageResponse` ne comprend qu'un sous-ensemble de CSS
 * et aucune variable CSS. Les couleurs sont donc écrites en dur ici, et doivent
 * rester accordées aux tokens de `globals.css`.
 */

export const TAILLE_OG = { width: 1200, height: 630 };
export const TYPE_OG = 'image/png';

const COULEURS = {
  fond: '#4F3FF0',
  surface: '#FFFFFF',
  bordure: '#FFFFFF38',
  texte: '#FFFFFF',
  attenue: '#D9D4FF',
  discret: '#C4BCFF',
  accent: '#FFFFFF',
};

export function imageOG({
  surtitre,
  valeur,
  legende,
  precision,
}: {
  surtitre: string;
  /** Le chiffre, déjà formaté au format belge. */
  valeur: string;
  legende: string;
  precision?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: COULEURS.fond,
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Marque, discrète : ce n'est pas elle qu'on partage. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: COULEURS.accent,
              color: COULEURS.fond,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            N
          </div>
          <div style={{ color: COULEURS.texte, fontSize: 26, fontWeight: 600 }}>Nestor</div>
        </div>

        {/* Le chiffre, sujet de l'image. */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              color: COULEURS.attenue,
              fontSize: 24,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
            }}
          >
            {surtitre}
          </div>
          <div
            style={{
              color: COULEURS.accent,
              fontSize: 116,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1.05,
              marginTop: 18,
            }}
          >
            {valeur}
          </div>
          <div
            style={{
              color: COULEURS.texte,
              fontSize: 34,
              lineHeight: 1.35,
              marginTop: 20,
              maxWidth: 940,
            }}
          >
            {legende}
          </div>
          {precision && (
            <div style={{ color: COULEURS.attenue, fontSize: 24, marginTop: 14, maxWidth: 940 }}>
              {precision}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `1px solid ${COULEURS.bordure}`,
            paddingTop: 26,
          }}
        >
          <div style={{ color: COULEURS.attenue, fontSize: 22 }}>
            Fiscalité belge comprise · Chaque chiffre s’explique
          </div>
          <div style={{ color: COULEURS.discret, fontSize: 22 }}>nestor.be</div>
        </div>
      </div>
    ),
    { ...TAILLE_OG, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } },
  );
}

/** Fond de secours, sans chiffre — pour les pages qui n'en produisent pas. */
export function imageOGSimple({ titre, sousTitre }: { titre: string; sousTitre: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: COULEURS.fond,
          padding: 88,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: COULEURS.accent,
              color: COULEURS.fond,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            N
          </div>
          <div style={{ color: COULEURS.texte, fontSize: 26, fontWeight: 600 }}>Nestor</div>
        </div>

        <div
          style={{
            color: COULEURS.texte,
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: -2.4,
            lineHeight: 1.1,
            maxWidth: 1000,
          }}
        >
          {titre}
        </div>
        <div
          style={{
            color: COULEURS.attenue,
            fontSize: 32,
            lineHeight: 1.4,
            marginTop: 26,
            maxWidth: 940,
          }}
        >
          {sousTitre}
        </div>
      </div>
    ),
    { ...TAILLE_OG, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } },
  );
}
