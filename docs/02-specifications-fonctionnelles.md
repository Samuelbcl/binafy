# 02 — Spécifications fonctionnelles

Architecture d'information globale. Chaque module a : objectif, écrans, données
d'entrée, calculs appelés, états vides et limites.

```
(marketing)                      (app)
├── /                            ├── /dashboard          Vue d'ensemble
├── /fiscalite                   ├── /patrimoine         Actifs & passifs
│   ├── /precompte-mobilier      ├── /budget             Flux mensuels
│   ├── /taxe-plus-values        ├── /projections        Simulateurs
│   ├── /tob                     ├── /objectifs          Buts chiffrés
│   ├── /droits-enregistrement   ├── /fiscalite          Position fiscale perso
│   ├── /revenus-locatifs        ├── /immobilier         Module achat/locatif
│   └── /independant-complementaire └── /parametres
├── /outils
│   ├── /interets-composes
│   ├── /simulateur-patrimoine
│   ├── /capacite-emprunt
│   ├── /frais-acquisition
│   └── /rendement-locatif
├── /blog
└── /a-propos
```

---

## Module 1 — Dashboard

**Objectif :** en 5 secondes, savoir si ça monte ou si ça descend, et pourquoi.

**Écran :**
- Bandeau : patrimoine net, variation sur la période, sélecteur `1J / 7J / 1M / 3M / 6M / YTD / 1A / TOUT`
- Courbe d'évolution du patrimoine net (aire, dégradé, tooltip au survol)
- Donut d'allocation par classe d'actif, avec légende cliquable et pourcentages
- Bande de 3 KPI : taux d'épargne du mois, patrimoine net d'impôt latent, revenus passifs projetés 12 mois
- Liste « Ce qui a bougé » : 5 dernières variations significatives

**État vide (important, c'est le premier écran après inscription) :**
pas de graphique vide et triste. Un parcours en 3 cartes : *Ajouter un compte* /
*Importer un CODA* / *Saisir manuellement*, avec un aperçu flouté de ce que ça donnera.

**Différence avec Finary :** le KPI « patrimoine net d'impôt latent ». On affiche le
patrimoine brut **et** ce qu'il resterait après taxation en cas de liquidation
(taxe sur les plus-values, précompte, TOB de sortie). Personne ne le fait.

---

## Module 2 — Patrimoine

**Objectif :** l'inventaire complet, synchronisé ou manuel.

**Classes d'actifs supportées (V1) :**

| Classe | Valorisation | Source |
|---|---|---|
| Comptes courants | Solde | PSD2 / CODA / manuel |
| Comptes d'épargne (réglementés ou non) | Solde + taux base + prime fidélité | PSD2 / manuel |
| Comptes-titres | Cours × quantité | API cotations |
| Fonds & ETF | VL × parts | API cotations |
| Actions individuelles | Cours × quantité | API cotations |
| Crypto | Cours × quantité | CoinGecko |
| Immobilier | Estimation manuelle + historique | Manuel |
| Assurance-groupe / EIP | Réserve acquise | Manuel |
| Épargne-pension | Valeur du contrat | Manuel |
| Créances, parts de société, autres | Manuel | Manuel |

**Passifs :** crédit hypothécaire (capital restant dû calculé depuis le tableau
d'amortissement), prêt à tempérament, dettes diverses. Le patrimoine net les déduit.

**Écrans :**
- Onglets `Actifs` / `Passifs`
- Filtres : par type, par établissement, par détenteur (utile en couple)
- Tableau triable : nom, type, part du total, valeur, +/- value, variation 1J
- Fiche détail d'un actif : historique de valeur, transactions, frais annuels estimés,
  traitement fiscal applicable (lien vers la page fiscalité correspondante)

**Notion de détenteur :** dès la V1. Samuel vit en couple et partage les dépenses.
Un actif peut être détenu à 100 %, 50 % ou X %. Le patrimoine affiché est **sa quote-part**,
avec un toggle « vue ménage ».

---

## Module 3 — Budget

**Objectif :** répondre à une seule question — combien j'épargne réellement chaque mois.

**Écrans :**
- Sélecteur de période (mois par défaut, `1M / 3M / 1A / personnalisé`)
- **Diagramme de Sankey** : revenus → grandes catégories → sous-catégories.
  C'est le meilleur élément de l'interface de Finary, on le reprend et on l'améliore
  en le rendant cliquable (un clic sur un flux filtre la liste des transactions).
- Phrase de synthèse générée : « Ton taux d'épargne est de X %. Revenus Y €,
  dépenses Z €, investi W €, il reste V € disponible. »
- Répartition en donut + tableau par catégorie avec évolution vs mois précédent
- Détection des dépenses récurrentes (abonnements) : regroupement par libellé et
  périodicité, avec le coût annualisé.

**Catégorisation :** règles utilisateur d'abord (libellé contient → catégorie),
puis classification automatique. Pour l'auto, commencer par une table de règles
sur les libellés belges courants (Colruyt, Delhaize, Proximus, Luminus, STIB, TEC…)
avant d'envisager un modèle. Une table de 200 règles couvre 80 % des cas.

**Spécificité belge à gérer :** le pécule de vacances et la prime de fin d'année
créent deux mois aberrants. Le calcul du taux d'épargne doit proposer une vue
« lissée sur 12 mois » en plus de la vue mensuelle, sinon les chiffres n'ont pas de sens.

---

## Module 4 — Projections

Quatre simulateurs, tous **paramétrables par URL** (voir `07-moteurs-de-calcul.md`).
L'état est encodé dans la query string : un lien partagé rejoue exactement la simulation.

1. **Intérêts composés** — capital initial, versement mensuel, durée, rendement.
   Sortie : courbe capital versé vs plus-values, tableau annuel.
2. **Simulateur de patrimoine** — patrimoine actuel, répartition, investissement annuel,
   horizon, rendement par poche, **fiscalité belge par poche**, taux de retrait, inflation.
   Sortie : patrimoine nominal et réel, rente mensuelle soutenable, âge d'indépendance.
3. **Capacité d'emprunt** — revenus, charges, durée, taux, quotité.
   Sortie : montant empruntable, mensualité, coût total, **cash nécessaire à l'acte**
   selon la Région et le type d'achat (propre et unique vs locatif).
4. **Rendement locatif belge** — prix, frais d'acquisition, loyer, charges, RC.
   Sortie : rendement brut, net de charges, net d'impôt (base RC indexé majoré),
   cash-flow mensuel réel avec crédit.

Chaque simulateur affiche un panneau **« D'où vient ce chiffre »** dépliable :
formule, valeurs des paramètres fiscaux utilisés, année de référence, lien source.

---

## Module 5 — Objectifs

**Objectif :** transformer une intention floue en date.

- Création d'un objectif : nom, montant cible, échéance souhaitée, actifs rattachés
- Barre de progression + date d'atteinte projetée au rythme d'épargne constaté
  (pas au rythme déclaré — au rythme réel des 6 derniers mois)
- Objectif spécial **« Épargne de précaution »** : la cible se calcule automatiquement
  à partir des charges fixes détectées dans le budget × nombre de mois choisi (3 à 6)
- Objectif spécial **« Apport immobilier »** : la cible se calcule via le module
  frais d'acquisition, donc elle est juste, et se met à jour si le budget change

Finary bloque la création d'objectifs sur le web et la renvoie au mobile. On la fait
sur le web dès le premier jour : c'est un différenciateur gratuit.

---

## Module 6 — Fiscalité (le module signature)

**Objectif :** un tableau de bord fiscal personnel, mis à jour en continu.

**Écran principal, quatre blocs :**

1. **Ma position fiscale de l'année** : revenu imposable estimé, tranche marginale,
   précompte mobilier déjà retenu, plus-values réalisées et solde de l'exonération annuelle
   restante sur la taxe sur les plus-values.
2. **Impôt latent** : ce que je paierais si je liquidais tout aujourd'hui, ligne par ligne.
3. **Alertes** : franchise TVA bientôt dépassée, seuil de cotisations sociales d'indépendant
   complémentaire approché, exonération de précompte sur dividendes non récupérée dans
   la déclaration, TOB majorée sur un fonds capitalisant.
4. **Bibliothèque** : les fiches explicatives, les mêmes que celles du site public,
   contextualisées avec les chiffres de l'utilisateur.

C'est ce module qui justifie l'existence du produit. Il doit être le plus soigné.

---

## Module 7 — Immobilier

Deux sous-parties :

**A. Projet d'achat** — assistant en 5 étapes :
Région → type d'achat (habitation propre et unique / autre / locatif) → budget visé →
revenus et apport → résultat. Sortie : cash total nécessaire à l'acte détaillé poste par
poste, capacité d'emprunt, mois d'épargne restants avant d'y arriver, et l'**alerte clé** :
si l'utilisateur envisage un locatif avant sa résidence principale, on lui chiffre ce que
lui coûte la perte du taux réduit sur son futur achat propre.

**B. Bien détenu** — suivi : valeur estimée, crédit lié, loyers, charges, précompte
immobilier, rendement net réel, part dans le patrimoine.

---

## Module 8 — Paramètres

Profil (Région fiscale, situation familiale, statut professionnel : salarié /
indépendant complémentaire / principal), connexions bancaires, détenteurs et quotes-parts,
devise, langue (fr-BE / nl-BE / en), export complet des données (RGPD), suppression du compte.

---

## Priorité de développement

Voir `08-roadmap.md`. Ordre court : Patrimoine manuel → Dashboard → Budget par import
CODA → Simulateurs → Fiscalité → Connexion PSD2 → Objectifs → Immobilier.
La connexion bancaire arrive **après** que l'app soit utile sans elle.
