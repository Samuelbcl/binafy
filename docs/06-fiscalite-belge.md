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

**Vérifié au texte le 07/09/2026.** L'exonération est **individuelle**, pas par ménage :
les intérêts d'un compte joint se divisent à parts égales entre titulaires, et chacun
applique la sienne — d'où le doublement apparent pour un couple. Un compte au nom d'un
seul conjoint ne donne droit qu'à une exonération, sauf régime matrimonial rendant les
revenus communs.

L'AR du 27 août 1993 (art. 2) encadre la structure : rémunération limitée à un taux de
base et une prime de fidélité, prime plafonnée à la moitié du taux de base maximal et
plancher au quart du taux offert, préavis possible au-delà d'un certain retrait, frais
limitativement énumérés. **Point non tranché** : le plafond exact du taux de base — les
sources divergent entre un maximum fixe et un maximum couplé au taux BCE. Non chiffré
tant que le texte coordonné n'est pas lu à la main.

L'AR du 18 juin 2013 impose l'affichage séparé des deux taux, en brut hors frais, et
interdit toute présentation incitant à les additionner.

**Banque étrangère** : la condition d'établissement belge a été jugée contraire à la
libre prestation de services (CJUE, C-580/15 *Van der Weegen*, 08/06/2017). L'exonération
s'étend aux établissements de l'EEE offrant un produit à critères analogues ;
l'administration reste réticente, la question se plaide.

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

**Report de l'exonération** (art. 96/2, al. 1er, 3° et al. 3 CIR 92, loi du 6 avril 2026
lue au texte le 07/09/2026) : la part d'exonération non consommée une année s'ajoute
aux suivantes par tranches annuelles (480 € de base, ~1 000 € indexés), jusqu'à un
plafond cumulé (2 426 € de base, ~5 000 € indexés), les plus anciennes imputées d'abord.
La loi ne garantit le montant rond de 1 000 € qu'à partir des revenus 2027 (art. 33) :
la valeur 2026 reste `verifie: false`. Le calculateur prend le report en entrée et le
suppose nul à défaut — l'hypothèse la moins flatteuse, jamais l'inverse.

**Rien n'est automatique** (art. 307 § 1er/1 CIR 92) : le précompte de 10 % est retenu
à la source ; exonération et report se réclament dans la déclaration, pièces à l'appui.

**Montants de base et indexation** (circulaire 2026/C/74, lue le 07/09/2026). La loi écrit
des montants de base à indexer selon l'article 178 CIR 92. Le coefficient de l'exercice
2027 vaut **2,0592** : 4 855 × 2,0592 = 9 997,42, arrondi à **10 000 €**, ce que la
circulaire confirme en toutes lettres.

**Le report n'existe pas encore.** La circulaire est explicite : « l'exonération
complémentaire ne pourra être déterminée et effectivement utilisée pour la première fois
qu'à partir de l'exercice d'imposition 2028, en tenant compte de la situation de
l'exercice d'imposition 2027 ». Traduit en années de revenus : ce qu'on ne consomme pas
en 2026 ouvre un report utilisable en 2027. Pour les revenus 2026, le report utilisable
est donc **nul**, et c'est cette valeur que porte le catalogue. Les montants de base
(480 € par an, plafond cumulé 2 426 €) attendent le coefficient de l'exercice 2028, que
le Roi ajustera pour faire tomber le premier sur 1 000 €.

⚠️ Toujours à traiter : compensation des moins-values et régime des participations
importantes (≥ 20 %, barème distinct, exonération d'un million sur cinq ans).

---

## 2. Revenus immobiliers

**Vérifié au Mémento fiscal du SPF le 07/09/2026.** Le précompte immobilier ne se déduit
de rien chez un bailleur : la base forfaitaire (RC indexé majoré) est réputée déjà nette
de charges, et l'imputation du précompte sur l'impôt final a été supprimée lorsqu'il est
devenu un impôt régional autonome — la date exacte de cette suppression n'a pas été
retrouvée. Exception hors périmètre du bailleur : le propriétaire qui affecte le bien à
sa propre activité peut le déduire comme charge professionnelle.

En location professionnelle, la formule de l'article 13 est confirmée : loyer réel moins
40 % de forfait, plafonné aux deux tiers du RC revalorisé. Le coefficient de
revalorisation vaut 5,75 pour les revenus 2026 (5,63 pour 2025), donné en clair par le
SPF. Ne cherche pas d'arrêté royal annuel : depuis 2021-2022 il s'auto-indexe par
l'article 13 lui-même — 4,23 × (indice santé de décembre N−2 / indice de décembre 2013).
Si le locataire est un particulier qui n'affecte qu'une partie du bien à sa profession,
la base porte sur le loyer **entier**, sauf bail enregistré répartissant explicitement
les deux usages.


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

**Vérifié le 07/09/2026.** Le rappel de droits en cas de rupture de condition est majoré
de l'**intérêt légal au taux civil**, exigible depuis l'enregistrement de l'acte
(art. 44bis §5 du Code wallon, rétabli par le décret du 05/12/2024) ; la force majeure et
la raison impérieuse familiale, médicale, professionnelle ou sociale sont prévues comme
exceptions. **Aucune portabilité** des droits en Wallonie — la Flandre a elle-même
supprimé la sienne en 2022. Le délai de prescription de l'action en récupération n'a pas
été retrouvé.

Flandre, depuis le 01/01/2026 : domiciliation dans les 3 ans **et** maintien ininterrompu
d'au moins 1 an, acquisitions scindées exclues du taux réduit. Bruxelles : abattement en
tout ou rien au-delà du prix plafond, domiciliation dans les 3 ans, maintien 5 ans,
abattement supplémentaire par classe énergétique gagnée (2 minimum) — non modélisé.

Neuf sous TVA : le terrain suit la TVA seulement si vendu avec le bâtiment, au même
acquéreur, par le même vendeur, simultanément. À défaut, il reste aux droits
d'enregistrement.

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

## 5 bis. Hors périmètre, et dit comme tel

Balayage d'actualité du 07/09/2026. Ces régimes existent, ont bougé en 2026, et
Nestor ne les modélise **pas** — par choix de cible (docs/01 : un salarié qui
épargne, pas un dirigeant de société), pas par oubli. Chaque calculateur concerné
le dit dans ses hypothèses.

- **VVPRbis** : précompte réduit sur les dividendes de sa propre société, passé de
  15 % à 18 % au 1er juillet 2026 (loi-programme du 29 mai 2026).
- **Réserve de liquidation** : précompte de sortie passé de 6,5 % à 9,8 %.
- **Participations importantes (≥ 20 %)** dans la taxe sur les plus-values : barème
  distinct (0 % jusqu'à un million sur cinq ans, puis 1,25 / 2,5 / 5 / 10 %).
- **Taxe annuelle sur les comptes-titres** : 0,15 % → 0,30 % au-delà d'un million.

**Gel d'indexation** (circulaire 2026/C/6, republiée, non lue en primaire) : les
plafonds d'épargne-pension, le panier d'épargne à long terme et les exonérations sur
dividendes et épargne réglementée sont figés jusqu'à l'exercice 2030. Leur péremption
est `legale`, pas `annuelle`.

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
