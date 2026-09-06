import type { Metadata } from 'next';
import { PageLegale, Section } from '@/components/legal/page-legale';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Éditeur, hébergeur et cadre réglementaire de Nestor.',
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLegalesPage() {
  return (
    <PageLegale titre="Mentions légales" miseAJour="6 septembre 2026">
      <Section titre="Éditeur">
        <p>
          <strong>Biancola Studio</strong>
          <br />
          Samuel Biancola
          <br />
          Liège, Belgique
        </p>
        <p>
          Contact :{' '}
          <a href="mailto:bonjour@nestor.be" className="text-primary underline underline-offset-2">
            bonjour@nestor.be
          </a>
        </p>
        <p className="text-text-subtle">
          Numéro d’entreprise (BCE) et adresse complète à compléter avant l’ouverture publique
          du service — l’article XII.6 du Code de droit économique les rend obligatoires pour
          tout service de la société de l’information.
        </p>
      </Section>

      <Section titre="Hébergement">
        <p>
          <strong>Vercel Inc.</strong> — application, région <code>fra1</code> (Francfort,
          Allemagne).
          <br />
          <strong>Supabase</strong> — base de données et authentification, région{' '}
          <code>eu-central-1</code> (Francfort, Allemagne).
        </p>
      </Section>

      <Section titre="Cadre réglementaire">
        <p>
          Nestor est un outil d’information et de simulation. Il ne fournit ni conseil en
          investissement, ni conseil fiscal, ni service de paiement, et ne distribue aucun
          produit financier.
        </p>
        <p>
          Il n’exerce donc aucune activité soumise à l’agrément de la{' '}
          <strong>FSMA</strong> (Autorité des services et marchés financiers) ni de la{' '}
          <strong>Banque nationale de Belgique</strong>.
        </p>
        <p>
          Lorsqu’un accès aux comptes bancaires est proposé, il s’appuie sur un prestataire de
          services d’information sur les comptes agréé au titre de la directive européenne
          PSD2, et reste strictement limité à la consultation.
        </p>
      </Section>

      <Section titre="Sources fiscales">
        <p>
          Les paramètres fiscaux utilisés proviennent des sources officielles belges : SPF
          Finances, Service public de Wallonie, Vlaamse overheid, Bruxelles Fiscalité, INASTI,
          Banque nationale de Belgique et Statbel. Chaque paramètre affiche sa source et sa date
          de vérification sous le calcul qui l’utilise.
        </p>
        <p>
          Les textes explicatifs sont rédigés à partir de ces sources. Aucun contenu n’est repris
          d’un service concurrent.
        </p>
      </Section>

      <Section titre="Propriété intellectuelle">
        <p>
          L’ensemble des contenus, textes, calculs et éléments d’interface de Nestor est protégé
          par le droit d’auteur. Les conventions d’interface répandues dans le secteur —
          tableaux de bord, graphiques d’allocation, diagrammes de flux — relèvent du domaine
          commun et ne font l’objet d’aucune revendication.
        </p>
      </Section>

      <Section titre="Signaler un problème">
        <p>
          Une erreur dans un calcul, un taux périmé, une faille de sécurité :{' '}
          <a href="mailto:bonjour@nestor.be" className="text-primary underline underline-offset-2">
            bonjour@nestor.be
          </a>
          . Les signalements de sécurité sont traités en priorité et ne feront jamais l’objet de
          poursuites lorsqu’ils sont faits de bonne foi.
        </p>
      </Section>
    </PageLegale>
  );
}
