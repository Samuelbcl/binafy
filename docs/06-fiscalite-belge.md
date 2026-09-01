# 06 — Fiscalité belge : spécification du moteur

> **Règle de travail.** Aucun chiffre de ce document n'est écrit en dur dans le code.
> Tout entre dans `tax_parameters` avec sa source et sa date de vérification.
> Les montants indexés changent chaque année : ce document donne la **mécanique**,
> la base de données porte les **valeurs**.
>
> Les chiffres ci-dessous sont ceux connus au 1er septembre 2026. Chaque valeur doit
> être revérifiée sur la source officielle avant mise en production, et la date de
> vérification enregistrée.

---

## 1. Revenus mobiliers

### Précompte mobilier
Taux standard de **30 %** sur les dividendes et les intérêts, généralement retenu
à la source par l'intermédiaire belge. Chez un courtier étranger (Degiro, Trade Republic,
Interactive Brokers…), le précompte **n'est pas retenu** : le contribuable doit déclarer
lui-même ces revenus. C'est une source d'erreur massive chez les jeunes investisseurs
belges, et donc une alerte à forte valeur dans Nestor.

Exonération : une première tranche de dividendes est exonérée par personne et par an,
**récupérable uniquement via la déclaration fiscale**. Beaucoup ne la réclament jamais.
→ Alerte Nestor : « Tu as perçu X € de dividendes, tu peux récupérer jusqu'à Y € ».

### Comptes d'épargne réglementés
Les intérêts sont exonérés jusqu'à un plafond annuel par contribuable ; au-delà,
un précompte réduit s'applique (taux distinct du taux standard). Deux composantes
à modéliser séparément : **taux de base** (acquis au jour le jour) et **prime de fidélité**
(acquise seulement après 12 mois de présence continue des fonds). Un retrait fait perdre
la prime : Nestor doit le signaler avant que l'utilisateur ne bouge son argent.

### Taxe sur les opérations de bourse (TOB)
Due à chaque achat **et** à chaque vente, avec un plafond par opération. Taux différents
selon le support :

| Support | Ordre de grandeur | Plafond |
|---|---|---|
| Actions et ETF cotés hors registre belge | ~0,12 % | oui |
| Actions, ETF distribuants inscrits en Belgique | ~0,35 % | oui |
| Fonds capitalisants inscrits en Belgique | ~1,32 % | oui |

Le taux dépend du caractère capitalisant ou distribuant et du lieu d'inscription du fonds.
D'où les champs `capitalisant` et `isin` sur `assets`. Chez un courtier étranger, la TOB
est parfois à déclarer soi-même.

### Taxe sur les plus-values des fonds obligataires (dite « Reynders »)
Prélèvement sur la composante d'intérêts lors de la vente d'un fonds dont la part
obligataire dépasse un seuil (10 %). D'où le champ `part_obligataire`.

### Taxe sur les plus-values sur actifs financiers (depuis 2026)
Nouvelle taxe **de 10 %** sur les plus-values réalisées sur actifs financiers
(actions, ETF, obligations, crypto, or), avec une **exonération annuelle de 10 000 €**
par personne, et une base qui ne prend en compte que la plus-value construite
**à partir du 1er janvier 2026** (valeur au 31/12/2025 comme point de départ).

Implications produit, à traiter comme des fonctionnalités à part entière :
1. Stocker une **valeur de référence au 31/12/2025** pour chaque actif détenu avant 2026.
2. Suivre le **solde de l'exonération annuelle** en temps réel dans le module fiscalité.
3. Calculer l'**impôt latent** sur les positions ouvertes.
4. Alerter en fin d'année si l'exonération annuelle n'est pas consommée alors que
   l'utilisateur a des plus-values latentes — sans jamais recommander de vendre.

⚠️ Régime récent : mécanismes de report de pertes, traitement des participations
importantes et modalités déclaratives à revérifier sur le SPF Finances avant mise en prod.

---

## 2. Revenus immobiliers

### Le principe belge, très différent de la France
Pour un bien loué à un particulier qui l'occupe à des fins privées, l'imposition ne
porte **pas sur les loyers réellement perçus** mais sur le **revenu cadastral indexé,
majoré de 40 %**, ajouté aux revenus globaux et taxé au taux progressif.

```
base imposable = RC × coefficient d'indexation de l'année × 1,40
```

Si le locataire affecte le bien à un usage professionnel, la base devient le **loyer réel
net de forfait de charges**, ce qui est nettement plus lourd. Le champ `usage_bien` pilote
donc tout le calcul.

Habitation propre : exonérée du RC à l'IPP.

### Précompte immobilier
Impôt régional annuel calculé sur le RC indexé, avec des additionnels provinciaux et
communaux très variables. Nestor doit permettre la saisie manuelle du montant réel de
l'avertissement-extrait de rôle, avec une estimation par défaut.

### Droits d'enregistrement à l'achat

| Région | Habitation propre et unique | Autre / locatif |
|---|---|---|
| **Wallonie** | **3 %** depuis le 01/01/2025 | 12,5 % |
| **Flandre** | 2 % | 12 % |
| **Bruxelles** | 12,5 % avec abattement sur une première tranche | 12,5 % |

Conditions wallonnes du taux à 3 % : acquisition en pleine propriété, établissement
de la résidence principale dans le délai légal et maintien pendant au moins 3 ans,
et **absence d'un autre immeuble d'habitation détenu en pleine propriété** à la date
de l'acte. Le non-respect entraîne le rappel de la différence, majorée d'intérêts.

**Conséquence produit majeure.** Acheter un bien locatif avant sa résidence principale
fait perdre le taux réduit sur l'achat suivant. Sur un bien à 280 000 €, l'écart entre
3 % et 12,5 % dépasse 26 000 €. Le module immobilier doit chiffrer cet arbitrage
explicitement : c'est le calcul qui, à lui seul, justifie l'app pour la cible.

### Frais d'acquisition complets
```
cash à l'acte = droits d'enregistrement (ou TVA 21 % sur du neuf)
              + honoraires du notaire pour l'acte d'achat (barème dégressif)
              + frais et débours administratifs
              + acte de crédit (droit d'hypothèque + honoraires + inscription)
              + apport propre exigé par la banque
```
La quotité recommandée par la BNB plafonne en pratique à ~90 % pour l'habitation propre
et ~80 % pour le locatif, d'où l'apport de 10 % ou 20 % en plus des frais.

---

## 3. Impôt des personnes physiques

Barème progressif à quatre tranches (25 / 40 / 45 / 50 %), avec une quotité de revenu
exemptée d'impôt et des additionnels communaux (moyenne autour de 7 %, variable par commune).
Les seuils sont indexés chaque année → `tax_parameters`, clé `ipp.tranche_n.plafond`.

Ce qui compte pour Nestor : le **taux marginal**. Tout euro de revenu complémentaire
(activité d'indépendant, loyer professionnel) est taxé à ce taux-là, pas au taux moyen.
Le module fiscalité doit l'afficher en permanence, c'est le chiffre qui change les décisions.

---

## 4. Statut d'indépendant

### Complémentaire
- Affiliation obligatoire à une caisse d'assurances sociales avant le début de l'activité ;
  l'affiliation elle-même est gratuite.
- Inscription à la BCE via un guichet d'entreprises : ~100 € ; activation du numéro de TVA
  autour de 78 € TVAC.
- **Cotisations sociales** : environ 20,5 % du revenu net imposable, plus des frais de
  gestion. **Sous un seuil annuel de revenu net (1 922,16 € en 2026), aucune cotisation
  n'est due.**
- **TVA** : régime de franchise possible sous 25 000 € de chiffre d'affaires annuel
  (pas de TVA facturée, pas de déclaration périodique, pas de déduction non plus).
- **Facturation électronique obligatoire entre assujettis à la TVA depuis le 01/01/2026**
  (format structuré type Peppol). À intégrer si Nestor ajoute un module facturation.
- Les revenus s'ajoutent au salaire et sont taxés **au taux marginal**, souvent 45-50 %.

### Alertes Nestor associées
- CA cumulé approchant 25 000 € → « tu vas sortir de la franchise TVA »
- Revenu net approchant le seuil de cotisations → « des cotisations vont commencer à courir »
- Revenu d'indépendant projeté × taux marginal → provision d'impôt à mettre de côté

C'est le module qui manque totalement chez les concurrents français et qui vise
exactement la cible « jeune entrepreneur belge ».

---

## 5. Enveloppes d'épargne belges

| Produit | Mécanique | À modéliser |
|---|---|---|
| **Épargne-pension** | Réduction d'impôt sur les versements, deux plafonds avec deux taux de réduction ; taxe anticipative à 60 ans | Le choix du plafond n'est pas neutre : à modéliser, pas à conseiller |
| **Épargne à long terme** | Réduction d'impôt, plafond lié au revenu, souvent saturé par le crédit hypothécaire | Interaction avec le crédit à signaler |
| **Branche 21** | Capital garanti, précompte sur les intérêts si sortie avant 8 ans, taxe de 2 % à l'entrée | |
| **Branche 23** | Fonds sans garantie, taxe de 2 % à l'entrée, pas de précompte à la sortie | Comparaison de frais utile |
| **Assurance-groupe / EIP** | Constitué par l'employeur ou la société ; taxation à la sortie selon l'âge | Saisie manuelle de la réserve acquise |

**Ne pas transposer les produits français.** Ni PEA, ni PER, ni assurance-vie au sens
français, ni Livret A. C'est précisément l'erreur qui rend les apps françaises inutilisables ici.

---

## 6. Sources à vérifier avant chaque mise en production

| Domaine | Source officielle |
|---|---|
| IPP, précompte mobilier, TOB, plus-values | SPF Finances (`finances.belgium.be`) |
| Droits d'enregistrement Wallonie | `logement.wallonie.be` et le décret wallon du 05/12/2024 |
| Statut d'indépendant, cotisations | INASTI et les caisses (Xerius, Partena, Securex, Acerta) |
| Quotités et crédit hypothécaire | Banque nationale de Belgique |
| Indexation, index santé, RC | Statbel |

**Processus annuel :** en janvier, une session dédiée à la mise à jour de `tax_parameters`
pour la nouvelle année. C'est une tâche récurrente inscrite dans la roadmap, pas un imprévu.

---

## 7. Avertissement à afficher

Toute page de calcul porte, en pied :

> Simulation informative fondée sur les paramètres fiscaux belges en vigueur au
> [date de vérification]. Ne constitue ni un conseil fiscal ni un conseil en investissement.
> Pour une situation personnelle, consultez un comptable ou un conseiller fiscal agréé.
