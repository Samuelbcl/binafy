'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { createContext, useContext, useMemo, useState, useSyncExternalStore } from 'react';

/**
 * Mode discrétion (doc 05).
 *
 * Un bouton œil remplace tous les montants par des points. Indispensable dans un
 * train ou un open space, et à implémenter en V1 — pas plus tard.
 *
 * L'état vit côté client uniquement : il ne concerne personne d'autre que la
 * personne devant l'écran, et il ne doit surtout pas transiter par le serveur.
 *
 * Implémenté avec `useSyncExternalStore` plutôt qu'un `useEffect` qui appelle
 * `setState` : `localStorage` est un système externe, et c'est le hook prévu pour
 * ça. Il évite le rendu en cascade et gère proprement l'écart entre le rendu
 * serveur (toujours visible) et l'état réel du navigateur.
 */

const CLE_STOCKAGE = 'nestor.discretion';

const storeDiscretion = {
  valeur: false,
  lu: false,
  ecouteurs: new Set<() => void>(),

  sabonner(callback: () => void): () => void {
    storeDiscretion.ecouteurs.add(callback);
    // Un autre onglet peut changer la préférence.
    const surStockage = (e: StorageEvent) => {
      if (e.key === CLE_STOCKAGE) {
        storeDiscretion.valeur = e.newValue === '1';
        storeDiscretion.notifier();
      }
    };
    window.addEventListener('storage', surStockage);

    return () => {
      storeDiscretion.ecouteurs.delete(callback);
      window.removeEventListener('storage', surStockage);
    };
  },

  notifier() {
    for (const callback of storeDiscretion.ecouteurs) callback();
  },

  /** Snapshot client. Lit le stockage une seule fois, puis sert le cache. */
  snapshot(): boolean {
    if (!storeDiscretion.lu) {
      try {
        storeDiscretion.valeur = window.localStorage.getItem(CLE_STOCKAGE) === '1';
      } catch {
        // Navigation privée ou stockage bloqué : on reste en mode visible.
      }
      storeDiscretion.lu = true;
    }
    return storeDiscretion.valeur;
  },

  /** Snapshot serveur : les montants sont visibles dans le HTML rendu. */
  snapshotServeur(): boolean {
    return false;
  },

  basculer() {
    storeDiscretion.valeur = !storeDiscretion.valeur;
    storeDiscretion.lu = true;
    try {
      window.localStorage.setItem(CLE_STOCKAGE, storeDiscretion.valeur ? '1' : '0');
    } catch {
      // Sans persistance, le mode reste actif pour la session en cours.
    }
    storeDiscretion.notifier();
  },
};

type DiscretionContexte = {
  discret: boolean;
  basculer: () => void;
};

const Discretion = createContext<DiscretionContexte>({
  discret: false,
  basculer: () => {},
});

export function useDiscretion(): DiscretionContexte {
  return useContext(Discretion);
}

function DiscretionProvider({ children }: { children: React.ReactNode }) {
  const discret = useSyncExternalStore(
    storeDiscretion.sabonner,
    storeDiscretion.snapshot,
    storeDiscretion.snapshotServeur,
  );

  const valeur = useMemo(
    () => ({ discret, basculer: storeDiscretion.basculer }),
    [discret],
  );

  return <Discretion.Provider value={valeur}>{children}</Discretion.Provider>;
}

/** Vrai une fois l'hydratation faite. Sert aux rendus qui diffèrent client/serveur. */
export function useEstMonte(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Les cotations ne bougent qu'une fois par jour : inutile de
            // retéléphoner à chaque changement d'onglet.
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <DiscretionProvider>{children}</DiscretionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
