'use client';

/**
 * Dernier filet : une erreur survenue dans le layout racine.
 * Ce composant remplace tout le document, il doit donc porter ses propres
 * balises html et body, et ne dépendre d'aucun provider.
 */
export default function ErreurGlobale({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr-BE">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#F6F6F8',
          color: '#0E0E12',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
            Nestor est momentanément indisponible
          </h1>
          <p style={{ marginTop: '0.75rem', color: '#71717A', fontSize: '0.875rem' }}>
            Tes données n’ont pas été affectées.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.75rem',
              minHeight: '2.75rem',
              padding: '0 1.25rem',
              borderRadius: '9999px',
              border: 'none',
              background: '#101014',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
          {error.digest && (
            <p style={{ marginTop: '2rem', fontSize: '0.6875rem', color: '#A1A1AA' }}>
              Référence : {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
