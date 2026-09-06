import type { Metadata } from 'next';
import { PageLegale, Section } from '@/components/legal/page-legale';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Quelles données Nestor collecte, pourquoi, combien de temps, et comment exercer tes droits.',
  alternates: { canonical: '/confidentialite' },
};

export default function ConfidentialitePage() {
  return (
    <PageLegale titre="Politique de confidentialité" miseAJour="6 septembre 2026">
      <Section titre="En résumé">
        <p>
          Nestor traite des données financières, qui sont parmi les plus sensibles qui soient.
          Trois engagements structurent tout le reste : l’hébergement est européen, rien n’est
          revendu ni partagé à des fins publicitaires, et tu peux à tout moment tout exporter
          ou tout effacer depuis tes paramètres.
        </p>
      </Section>

      <Section titre="Responsable du traitement">
        <p>
          Biancola Studio, Liège, Belgique. Pour toute question relative à tes données :{' '}
          <a href="mailto:privacy@nestor.be" className="text-primary underline underline-offset-2">
            privacy@nestor.be
          </a>
          .
        </p>
      </Section>

      <Section titre="Données traitées">
        <p>Nestor collecte uniquement ce qui est nécessaire au fonctionnement du service.</p>
        <ul>
          <li>
            <strong>Compte</strong> — adresse email, date de création. L’authentification se
            fait par lien envoyé par email : aucun mot de passe n’est stocké.
          </li>
          <li>
            <strong>Profil fiscal</strong> — prénom, Région, commune, situation familiale,
            statut professionnel. Ces éléments déterminent les taux appliqués dans les calculs.
          </li>
          <li>
            <strong>Patrimoine</strong> — actifs, passifs, valeurs, dates et prix d’acquisition,
            quotes-parts de détention.
          </li>
          <li>
            <strong>Transactions</strong> — celles que tu importes, avec leur date, leur montant
            et leur libellé. Les fichiers d’extraits eux-mêmes ne sont pas conservés : seules
            les transactions extraites sont enregistrées.
          </li>
          <li>
            <strong>Journal d’accès</strong> — horodatage et type d’action, sans aucun montant.
          </li>
        </ul>
        <p>
          Nestor ne collecte ni ton numéro de registre national, ni ton numéro de compte
          complet, ni aucun document d’identité.
        </p>
      </Section>

      <Section titre="Bases légales">
        <ul>
          <li>
            <strong>Exécution du contrat</strong> (art. 6.1.b RGPD) — pour la tenue de ton
            compte, la consolidation de ton patrimoine et les calculs.
          </li>
          <li>
            <strong>Consentement explicite</strong> (art. 9.2.a RGPD) — pour toute connexion
            bancaire, qui reste révocable à tout instant depuis tes paramètres.
          </li>
          <li>
            <strong>Obligation légale</strong> (art. 6.1.c RGPD) — pour la conservation des
            journaux d’accès.
          </li>
        </ul>
      </Section>

      <Section titre="Hébergement et sous-traitants">
        <p>
          Toutes les données sont hébergées dans l’Union européenne et chiffrées au repos comme
          en transit.
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — base de données et authentification, région
            <code> eu-central-1</code> (Francfort, Allemagne).
          </li>
          <li>
            <strong>Vercel</strong> — hébergement de l’application, région <code>fra1</code>
            (Francfort, Allemagne).
          </li>
          <li>
            <strong>Resend</strong> — envoi des emails transactionnels (lien de connexion,
            alertes). Seule ton adresse email lui est transmise.
          </li>
        </ul>
        <p>
          Aucun de ces sous-traitants n’a le droit d’utiliser tes données à d’autres fins que la
          fourniture de son service. Aucune donnée n’est transférée hors de l’Union européenne.
        </p>
      </Section>

      <Section titre="Connexions bancaires">
        <p>
          Lorsque tu connectes une banque, l’accès est <strong>strictement en lecture seule</strong>.
          Nestor ne peut initier aucun paiement, aucun virement, aucun ordre de bourse — cette
          limitation est technique, pas seulement contractuelle.
        </p>
        <p>
          Les jetons d’accès sont chiffrés en base et ne quittent jamais le serveur. Un
          consentement PSD2 expire automatiquement après 90 jours et doit être renouvelé
          explicitement par tes soins.
        </p>
      </Section>

      <Section titre="Durées de conservation">
        <ul>
          <li>
            <strong>Données de compte et patrimoine</strong> — tant que ton compte existe, puis
            effacement immédiat à sa suppression.
          </li>
          <li>
            <strong>Journaux d’accès</strong> — 12 mois.
          </li>
          <li>
            <strong>Jetons bancaires</strong> — jusqu’à expiration du consentement ou révocation.
          </li>
        </ul>
      </Section>

      <Section titre="Ce que Nestor ne fait pas">
        <ul>
          <li>Aucune revente ni partage de données à des tiers commerciaux.</li>
          <li>Aucun profilage publicitaire, aucun scoring de crédit.</li>
          <li>Aucun cookie de mesure d’audience tiers ni traceur publicitaire.</li>
          <li>Aucune décision automatisée produisant des effets juridiques à ton égard.</li>
        </ul>
      </Section>

      <Section titre="Tes droits">
        <p>
          Conformément au RGPD, tu disposes d’un droit d’accès, de rectification, d’effacement,
          de limitation, d’opposition et de portabilité.
        </p>
        <p>
          L’accès, la portabilité et l’effacement s’exercent directement depuis{' '}
          <strong>Paramètres → Données personnelles</strong>, sans avoir à écrire à
          quiconque ni à attendre. Pour les autres droits, écris à{' '}
          <a href="mailto:privacy@nestor.be" className="text-primary underline underline-offset-2">
            privacy@nestor.be
          </a>
          .
        </p>
        <p>
          Tu peux introduire une réclamation auprès de l’Autorité de protection des données,
          rue de la Presse 35, 1000 Bruxelles —{' '}
          <a
            href="https://www.autoriteprotectiondonnees.be"
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary underline underline-offset-2"
          >
            autoriteprotectiondonnees.be
          </a>
          .
        </p>
      </Section>

      <Section titre="Cookies">
        <p>
          Nestor n’utilise que des cookies strictement nécessaires : un cookie de session pour
          te garder connecté, et un stockage local pour tes préférences d’affichage (thème,
          mode discrétion). Ces derniers ne quittent jamais ton navigateur. Aucun cookie
          publicitaire, aucun traceur tiers, donc aucune bannière de consentement à subir.
        </p>
      </Section>

      <Section titre="Modifications">
        <p>
          Toute modification substantielle de cette politique sera annoncée par email au moins
          30 jours avant son entrée en vigueur.
        </p>
      </Section>
    </PageLegale>
  );
}
