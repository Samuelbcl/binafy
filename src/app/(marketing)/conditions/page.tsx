import type { Metadata } from 'next';
import Link from 'next/link';
import { PageLegale, Section } from '@/components/legal/page-legale';

export const metadata: Metadata = {
  title: 'Conditions d’utilisation',
  description: 'Ce que Nestor fait, ce qu’il ne fait pas, et dans quel cadre.',
  alternates: { canonical: '/conditions' },
};

export default function ConditionsPage() {
  return (
    <PageLegale titre="Conditions d’utilisation" miseAJour="6 septembre 2026">
      <Section titre="Objet">
        <p>
          Nestor est un outil d’information et de simulation destiné au suivi de patrimoine
          personnel en Belgique. Il consolide des données que tu saisis ou importes, et te
          présente des calculs fondés sur la réglementation fiscale belge.
        </p>
      </Section>

      <Section titre="Nestor informe, il ne conseille pas">
        <p>
          C’est la limite la plus importante de ce document, et elle n’est pas cosmétique. En
          Belgique, le conseil en investissement est une activité réglementée, encadrée par la
          FSMA. Nestor n’est ni un conseiller en investissement, ni un intermédiaire financier,
          ni un courtier, ni un conseiller fiscal agréé.
        </p>
        <p>Concrètement :</p>
        <ul>
          <li>
            Aucun écran ne te dira d’acheter, de vendre ou d’arbitrer quoi que ce soit. Nestor
            chiffre des écarts et explique des règles ; la décision reste entièrement la tienne.
          </li>
          <li>
            Aucun produit financier n’est vendu, distribué ni mis en avant. Nestor n’a aucun
            produit maison, donc aucun conflit d’intérêts à arbitrer.
          </li>
          <li>
            Aucun ordre de bourse ni mouvement d’argent n’est possible depuis l’application.
            L’accès bancaire, lorsqu’il existe, est techniquement limité à la lecture.
          </li>
        </ul>
      </Section>

      <Section titre="Exactitude des calculs">
        <p>
          Les paramètres fiscaux utilisés sont stockés avec leur source officielle et leur date
          de vérification, et affichés sous chaque calcul. Certains sont encore signalés comme{' '}
          <em>en attente de confirmation</em> : l’interface le précise explicitement sur tout
          résultat qui en dépend.
        </p>
        <p>
          Les simulations reposent sur des hypothèses simplificatrices, toujours listées sous le
          résultat. Elles ne remplacent ni une déclaration fiscale, ni l’avis d’un comptable ou
          d’un conseiller fiscal agréé. Pour une situation personnelle — et particulièrement
          avant un achat immobilier ou une opération de cession — consulte un professionnel.
        </p>
        <p>
          Nestor ne garantit pas l’exactitude des montants affichés et ne peut être tenu
          responsable d’une décision prise sur leur seule base.
        </p>
      </Section>

      <Section titre="Ton compte">
        <ul>
          <li>Tu dois avoir 18 ans accomplis et résider en Belgique.</li>
          <li>
            Tu es responsable de l’exactitude des données que tu saisis. Un patrimoine mal
            renseigné produit des calculs justes sur des chiffres faux.
          </li>
          <li>
            L’accès se fait par lien envoyé à ton adresse email : garde cette boîte sécurisée,
            elle est la clé de ton compte.
          </li>
          <li>
            Tu peux exporter ou supprimer l’ensemble de tes données à tout moment depuis tes
            paramètres, sans avoir à le demander.
          </li>
        </ul>
      </Section>

      <Section titre="Disponibilité">
        <p>
          Nestor est développé par une seule personne. Le service est fourni en l’état, sans
          garantie de disponibilité continue. Des interruptions pour maintenance ou évolution
          peuvent survenir sans préavis.
        </p>
        <p>
          Les connexions bancaires dépendent de prestataires tiers et de la disponibilité des
          interfaces des banques : elles peuvent cesser de fonctionner sans que Nestor y puisse
          quoi que ce soit. C’est précisément pour cela que l’import de fichiers reste disponible
          en toutes circonstances.
        </p>
      </Section>

      <Section titre="Propriété">
        <p>
          Tes données t’appartiennent. Le code, les textes explicatifs et l’interface de Nestor
          restent la propriété de Biancola Studio.
        </p>
      </Section>

      <Section titre="Résiliation">
        <p>
          Tu peux supprimer ton compte à tout moment, sans motif et sans délai. Nous pouvons
          suspendre un compte en cas d’usage manifestement abusif — tentative d’atteinte à la
          sécurité du service ou aux données d’autres utilisateurs.
        </p>
      </Section>

      <Section titre="Droit applicable">
        <p>
          Ces conditions sont soumises au droit belge. Tout litige relève de la compétence des
          tribunaux de l’arrondissement judiciaire de Liège, sans préjudice des dispositions
          protectrices applicables aux consommateurs.
        </p>
      </Section>

      <Section titre="Contact">
        <p>
          <a href="mailto:bonjour@nestor.be" className="text-primary underline underline-offset-2">
            bonjour@nestor.be
          </a>{' '}
          — voir aussi la{' '}
          <Link href="/confidentialite" className="text-primary underline underline-offset-2">
            politique de confidentialité
          </Link>{' '}
          et les{' '}
          <Link href="/mentions-legales" className="text-primary underline underline-offset-2">
            mentions légales
          </Link>
          .
        </p>
      </Section>
    </PageLegale>
  );
}
