# 08 — Roadmap

Contrainte de base : un développeur solo, salarié à temps plein à côté. La roadmap est
découpée en lots livrables en une à deux sessions, avec un critère de sortie vérifiable.

---

## MVP — « utile pour moi » (objectif : 6 à 8 semaines de soirées)

Critère de sortie global : **Samuel a supprimé son fichier Excel.**

### Lot 1 — Socle
- Projet Next.js 15 + Tailwind v4 + shadcn, thème sombre et clair, tokens de `05`
- Supabase : auth email + magic link, tables `profiles`, `holders`, migrations versionnées
- Layout applicatif : sidebar, header, mode discrétion
- *Sortie : je peux me connecter et voir un dashboard vide propre.*

### Lot 2 — Patrimoine manuel
- CRUD actifs et passifs, toutes les classes de `04`
- Quotes-parts de détention, vue perso / vue ménage
- Job quotidien d'écriture des snapshots
- *Sortie : mes 13 656 € apparaissent, ventilés, avec un historique qui se construit.*

### Lot 3 — Dashboard
- Courbe de patrimoine net avec sélecteur de période
- Donut d'allocation, cartes KPI
- *Sortie : l'écran d'accueil vaut mieux qu'un tableur.*

### Lot 4 — Budget par import
- Import CSV avec mapping de colonnes, déduplication
- Catégories, règles de catégorisation, ~200 règles pour les libellés belges courants
- Sankey, taux d'épargne mensuel et lissé 12 mois
- *Sortie : je connais mon taux d'épargne réel des 6 derniers mois, sans le calculer à la main.*

### Lot 5 — Moteur fiscal, socle
- Table `tax_parameters` remplie pour 2026 avec sources et dates de vérification
- `lib/tax` : précompte, TOB, taxe sur les plus-values, RC indexé, droits d'enregistrement
- Tests unitaires complets
- *Sortie : chaque taux est en base, sourcé, et testé.*

### Lot 6 — Simulateurs
- Intérêts composés, simulateur de patrimoine, capacité d'emprunt et frais d'acquisition,
  rendement locatif — tous avec état dans l'URL et panneau « D'où vient ce chiffre »
- *Sortie : je peux répondre à « combien de mois avant d'avoir l'apport » en 10 secondes.*

---

## V1 — « publiable » (3 à 4 mois après le MVP)

- **Parseur CODA** (le différenciateur technique belge)
- **Connexion PSD2** via GoCardless, avec gestion du consentement à 90 jours
- **Module fiscalité personnel** : position de l'année, impôt latent, alertes
- **Module immobilier** : assistant d'achat, arbitrage RP / locatif chiffré
- **Objectifs**, dont épargne de précaution et apport immobilier calculés automatiquement
- **2FA TOTP**, export et suppression RGPD
- **Site public** : pages piliers fiscalité + outils gratuits sans compte (voir `09`)
- Rapport mensuel par email (Resend)

Critère de sortie : **10 utilisateurs belges qui ne sont pas des amis** l'utilisent
deux mois d'affilée.

---

## V2 — « produit »

- Module **indépendant** : franchise TVA, seuils de cotisations, provision d'impôt,
  vue société + personnel
- **nl-BE** complet (sans le néerlandais, la moitié du marché belge est hors d'atteinte)
- Application mobile (Expo, en réutilisant le moteur de calcul)
- Nestor Plus : synchronisation automatique, rapports, scénarios illimités
- Comparateur de frais de courtiers et de fonds, sourcé

---

## Entretien récurrent

| Quand | Quoi |
|---|---|
| Janvier | Mise à jour de `tax_parameters` pour la nouvelle année, avec sources |
| Chaque trimestre | Vérification des connexions bancaires et des consentements |
| Chaque déploiement | Tests du moteur fiscal en vert, obligatoire |

---

## Pièges identifiés d'avance

1. **Commencer par la connexion bancaire.** C'est la partie la plus frustrante et la
   moins gratifiante. Le Lot 4 par import CSV donne 80 % de la valeur pour 20 % de l'effort.
2. **Vouloir couvrir les trois Régions dès le départ.** Wallonie d'abord, c'est le
   marché de Samuel, et le modèle de données prévoit déjà les autres.
3. **Ajouter la crypto, les SCPI et les montres avant d'avoir un budget qui marche.**
4. **Le neuvième projet.** Nestor est le projet en cours. Si une idée arrive pendant
   le développement, elle va dans `docs/idees.md` et n'en sort pas avant la V1.
