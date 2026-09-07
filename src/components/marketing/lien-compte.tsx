'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/db/client';

/**
 * Le bouton de droite de l'en-tête public.
 *
 * Les guides et les outils vivent sur le site public, mais l'application y
 * renvoie : un utilisateur connecté qui ouvre un guide se retrouvait devant
 * « Créer mon compte », sans chemin de retour. Ce composant regarde s'il y a une
 * session et propose alors le tableau de bord.
 *
 * La vérification se fait **côté navigateur**, à dessein : lire les cookies dans
 * le layout rendrait dynamiques toutes les pages publiques, y compris celles qui
 * doivent rester statiques pour le référencement. Le coût est un très bref
 * affichage de l'état déconnecté avant l'hydratation, ce qui est sans
 * conséquence — la page ne dépend pas de ce bouton pour être lisible.
 */
export function LienCompte() {
  const [connecte, setConnecte] = useState(false);

  useEffect(() => {
    let vivant = true;

    supabaseNavigateur()
      .auth.getSession()
      .then(({ data }) => {
        if (vivant) setConnecte(data.session !== null);
      })
      .catch(() => {
        // Pas de session lisible : on reste sur l'état déconnecté.
      });

    return () => {
      vivant = false;
    };
  }, []);

  return (
    <Link
      href={connecte ? '/dashboard' : '/connexion'}
      className="bouton-principal ml-0.5 px-3.5 sm:ml-1.5 sm:px-5"
    >
      {/* Le libelle long ne tient pas a cote des liens sur un ecran de 390px. */}
      <span className="sm:hidden">{connecte ? 'Mon espace' : 'Compte'}</span>
      <span className="hidden sm:inline">
        {connecte ? 'Mon tableau de bord' : 'Créer mon compte'}
      </span>
    </Link>
  );
}
