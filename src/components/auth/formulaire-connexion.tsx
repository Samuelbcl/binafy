'use client';

import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useId, useState } from 'react';
import { z } from 'zod';
import { supabaseNavigateur } from '@/lib/db/client';

/**
 * Connexion par lien magique (docs/03 § auth).
 *
 * Pas de mot de passe : un mot de passe de plus, c'est un mot de passe réutilisé
 * de plus. La 2FA TOTP viendra avant l'ouverture au public, comme prévu.
 */

const schemaEmail = z.string().trim().toLowerCase().email('Cette adresse email n’est pas valide.');

type Etat =
  | { statut: 'saisie' }
  | { statut: 'envoi' }
  | { statut: 'envoye'; email: string }
  | { statut: 'erreur'; message: string };

export function FormulaireConnexion({
  /** Page demandée avant la redirection, mémorisée par le middleware. */
  suite = '/dashboard',
  /** Message éventuellement renvoyé par /auth/callback. */
  messageErreur = null,
}: {
  suite?: string;
  messageErreur?: string | null;
}) {
  const idEmail = useId();
  const [email, setEmail] = useState('');
  const [etat, setEtat] = useState<Etat>({ statut: 'saisie' });

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();

    const valide = schemaEmail.safeParse(email);
    if (!valide.success) {
      setEtat({
        statut: 'erreur',
        message: valide.error.issues[0]?.message ?? 'Adresse invalide.',
      });
      return;
    }

    setEtat({ statut: 'envoi' });

    try {
      const supabase = supabaseNavigateur();
      const { error } = await supabase.auth.signInWithOtp({
        email: valide.data,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?suite=${encodeURIComponent(suite)}`,
        },
      });

      if (error) {
        setEtat({
          statut: 'erreur',
          message:
            "L'envoi a échoué. Réessaie dans un instant — si ça persiste, c'est probablement " +
            'la configuration email du projet Supabase.',
        });
        return;
      }

      setEtat({ statut: 'envoye', email: valide.data });
    } catch {
      setEtat({
        statut: 'erreur',
        message: 'Impossible de joindre le serveur d’authentification.',
      });
    }
  }

  if (etat.statut === 'envoye') {
    return (
      <div className="carte space-y-3 p-5 text-center">
        <CheckCircle2 className="mx-auto size-6 text-positive" />
        <p className="text-[15px] font-medium">Regarde tes emails</p>
        <p className="text-[13px] leading-relaxed text-text-muted">
          Un lien de connexion a été envoyé à{' '}
          <span className="font-medium text-text">{etat.email}</span>. Il est valable une heure
          et ne fonctionne qu’une fois.
        </p>
        <button
          type="button"
          onClick={() => setEtat({ statut: 'saisie' })}
          className="min-h-11 text-[13px] text-text-muted underline underline-offset-2 transition-colors hover:text-text"
        >
          Utiliser une autre adresse
        </button>
      </div>
    );
  }

  const enCours = etat.statut === 'envoi';

  return (
    <form onSubmit={envoyer} className="carte space-y-4 p-5">
      <div className="space-y-1.5">
        <label htmlFor={idEmail} className="label-kpi block">
          Adresse email
        </label>
        <input
          id={idEmail}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (etat.statut === 'erreur') setEtat({ statut: 'saisie' });
          }}
          placeholder="prenom@exemple.be"
          aria-invalid={etat.statut === 'erreur'}
          aria-describedby={etat.statut === 'erreur' ? `${idEmail}-erreur` : undefined}
          className="h-11 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-[15px] transition-colors focus:border-primary focus:outline-none"
        />
      </div>

      {messageErreur && etat.statut === 'saisie' && (
        <p role="alert" className="text-[12px] leading-relaxed text-warning">
          {messageErreur}
        </p>
      )}

      {etat.statut === 'erreur' && (
        <p
          id={`${idEmail}-erreur`}
          role="alert"
          className="text-[12px] leading-relaxed text-negative"
        >
          {etat.message}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="bouton-principal w-full"
      >
        {enCours ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Envoi…
          </>
        ) : (
          <>
            <Mail className="size-4" />
            Recevoir un lien de connexion
          </>
        )}
      </button>
    </form>
  );
}
