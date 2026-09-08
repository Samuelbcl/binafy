/**
 * « Bonjour » jusqu'à dix-huit heures, « Bonsoir » ensuite — à l'heure de
 * Bruxelles, pas à celle du serveur. Un mot, mais c'est le premier de l'écran.
 */
export function salutation(maintenant = new Date()): 'Bonjour' | 'Bonsoir' {
  const heure = Number(
    new Intl.DateTimeFormat('fr-BE', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Europe/Brussels',
    }).format(maintenant),
  );
  return heure >= 18 || heure < 5 ? 'Bonsoir' : 'Bonjour';
}
