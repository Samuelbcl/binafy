'use client';

import { useCallback, useState } from 'react';

/**
 * État d'un simulateur, synchronisé avec la query string.
 *
 * Trois exigences qui semblent incompatibles :
 *
 *  1. **Le résultat doit être dans le HTML.** Ces pages sont le canal
 *     d'acquisition : un moteur de recherche qui ne voit qu'un squelette
 *     n'indexe rien d'utile. Les valeurs initiales arrivent donc du serveur.
 *  2. **L'URL doit refléter la simulation**, pour qu'un lien partagé la rejoue.
 *  3. **La saisie doit être instantanée.** Passer par `router.replace` à chaque
 *     frappe déclencherait un aller-retour serveur et un rendu complet.
 *
 * La conciliation : l'état vit dans React, et l'URL est réécrite via
 * `history.replaceState`, qui met la barre d'adresse à jour sans provoquer de
 * navigation ni de nouveau rendu serveur.
 */
export function useEtatUrl<T extends Record<string, string | number | boolean>>(
  valeursInitiales: T,
) {
  const [valeurs, setValeurs] = useState<T>(valeursInitiales);

  const definir = useCallback(<K extends keyof T>(cle: K, valeur: T[K]) => {
    setValeurs((precedent) => {
      const suivant = { ...precedent, [cle]: valeur };

      // La barre d'adresse suit, sans navigation : le lien reste partageable
      // et le bouton retour ne se remplit pas d'une entrée par frappe.
      try {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(suivant)) {
          params.set(k, String(v));
        }
        window.history.replaceState(null, '', `?${params.toString()}`);
      } catch {
        // Sans History API, le simulateur fonctionne, il n'est simplement
        // plus partageable.
      }

      return suivant;
    });
  }, []);

  return [valeurs, definir] as const;
}
