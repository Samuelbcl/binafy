# 07 — Moteurs de calcul

Toutes les fonctions vivent dans `lib/finance/` et `lib/tax/`. Ce sont des **fonctions
pures**, sans accès réseau ni base. Elles reçoivent les paramètres fiscaux en argument
(injectés depuis `tax_parameters`), jamais en les lisant elles-mêmes.

Signature commune :

```ts
type CalcResult<T> = {
  result: T;
  breakdown: { libelle: string; valeur: number; unite?: string }[];
  sources: { cle: string; annee: number; url: string }[];
  hypotheses: string[];
};
```

Le `breakdown` alimente le panneau « D'où vient ce chiffre » de l'interface.
C'est une exigence produit, pas un confort de debug.

---

## 1. Intérêts composés

```
V = C₀ × (1+r)ⁿ + M × [((1+r)ⁿ − 1) / r] × (1+r)
```
avec `r` = taux périodique, `n` = nombre de périodes, `M` = versement en début de période.

Paramètres d'URL (mêmes conventions que les outils du marché, pour la lisibilité) :
`?capital_initial=10000&epargne_mensuelle=100&horizon=20&taux=5`

Sorties : valeur finale, total versé, plus-values, courbe annuelle empilée
(versé / plus-values), et **version nette de fiscalité belge** en option
(taxe sur les plus-values de 10 % au-delà de l'exonération annuelle).

Ce dernier point est le différenciateur : un calculateur d'intérêts composés brut,
tout le monde en a un.

---

## 2. Simulateur de patrimoine

Paramètres d'entrée : patrimoine actuel, répartition initiale (part actions / autres),
investissement annuel, répartition de l'investissement, horizon, rendement actions,
rendement autres, **fiscalité actions**, **fiscalité autres**, taux de retrait, inflation.

```
Pour chaque année t :
  rendement_brut  = patrimoine_t × rendement_pondéré
  rendement_net   = rendement_brut × (1 − fiscalité_pondérée)
  patrimoine_t+1  = patrimoine_t + rendement_net + investissement_annuel
  patrimoine_réel = patrimoine_t+1 / (1 + inflation)^t

rente_mensuelle_soutenable = patrimoine_final × taux_retrait / 12
```

Sorties : courbe nominale et réelle, patrimoine final, rente soutenable, **année où la
rente couvre les dépenses actuelles** (l'« âge d'indépendance »), et un tableau annuel.

Bien afficher les deux courbes. Un patrimoine de 500 000 € dans 20 ans avec 3 %
d'inflation ne vaut pas 500 000 € d'aujourd'hui, et c'est l'information la plus utile
du simulateur.

Valeurs par défaut belges à proposer : fiscalité actions 10 % (taxe sur les plus-values,
hors exonération), fiscalité autres 30 % (précompte mobilier), inflation 2 %.

---

## 3. Capacité d'emprunt et frais d'acquisition

### Mensualité
```
mensualité = C × i / (1 − (1+i)^(−n))     i = taux annuel / 12,  n = durée en mois
```

### Capacité
```
mensualité_max ≈ revenus_nets_mensuels × ratio_charge_max   (ratio courant : 1/3)
capacité = mensualité_max × (1 − (1+i)^(−n)) / i
```
Affiner avec un contrôle de **reste à vivre** : `revenus − mensualité − charges fixes`
doit rester au-dessus d'un plancher paramétrable selon la composition du ménage.
Pour un investissement locatif, ajouter une fraction du loyer attendu (70-80 %) aux
revenus pris en compte.

### Cash nécessaire à l'acte

```ts
function cashNecessaire(input: {
  prix: number;
  region: 'wallonie'|'bruxelles'|'flandre';
  typeAchat: 'propre_unique'|'autre'|'locatif';
  neuf: boolean;           // TVA 21 % au lieu des droits d'enregistrement
  quotite: number;         // 0.90 habitation propre, 0.80 locatif
}): CalcResult<number>
```
Postes : droits d'enregistrement (ou TVA) + honoraires notaire acte d'achat +
frais et débours + acte de crédit (droit d'hypothèque + honoraires + inscription)
+ apport = prix × (1 − quotité).

### Arbitrage RP / locatif — la fonction signature
```ts
function coutOrdreAchat(input: {
  prixLocatifEnvisage: number;
  prixResidencePrincipaleFuture: number;
  region: 'wallonie'|'bruxelles'|'flandre';
}): CalcResult<{ surcoutDroits: number; explication: string }>
```
Calcule ce que coûte l'achat d'un locatif **avant** sa résidence principale : perte du
taux réduit sur l'achat suivant. En Wallonie, sur une RP future à 280 000 €, l'écart
entre 3 % et 12,5 % dépasse 26 000 €. On affiche le chiffre, on n'ordonne rien.

---

## 4. Rendement locatif belge

```
rendement_brut     = loyer_annuel / (prix + frais_acquisition)
rendement_net_charges = (loyer_annuel − charges − précompte_immobilier − vacance − gestion)
                        / (prix + frais_acquisition)
```

Impôt (location privée) :
```
base_imposable = RC × coefficient_indexation × 1,40
impôt          = base_imposable × taux_marginal_IPP
```
Location à usage professionnel : base = loyer réel diminué du forfait de charges légal.

Cash-flow mensuel réel :
```
cash_flow = loyer − mensualité_crédit − charges − provision_travaux
            − précompte_immobilier/12 − impôt/12
```

Toujours afficher le cash-flow **après impôt**. Un rendement brut de 6 % qui donne
un cash-flow négatif est un piège, et c'est le cas le plus fréquent.

---

## 5. Taux d'épargne

```
taux_epargne = (revenus − dépenses) / revenus
```
Deux modes obligatoires :
- **Mensuel** : le mois en cours
- **Lissé 12 mois** : indispensable en Belgique à cause du pécule de vacances et
  de la prime de fin d'année, qui rendent deux mois par an non représentatifs

Distinguer aussi « épargné » (reste sur un compte) et « investi » (part vers des actifs
de rendement) : ce sont deux lignes différentes dans le Sankey, comme chez les meilleurs outils.

---

## 6. Impôt latent

```
impôt_latent = Σ pour chaque position :
    max(0, valeur_actuelle − base_de_référence) × taux_plus_values
  + TOB estimée à la vente
  + précompte sur intérêts courus
```
`base_de_référence` = prix d'acquisition, ou **valeur au 31/12/2025** pour les positions
détenues avant l'entrée en vigueur de la taxe sur les plus-values. Déduire l'exonération
annuelle restante.

C'est le calcul qui distingue Nestor : partout ailleurs, un patrimoine s'affiche brut.

---

## Tests

`lib/tax/*` et `lib/finance/*` en couverture 100 %. Pour chaque fonction :
un cas nominal, un cas limite (zéro, valeur négative, horizon de 1 an), et un cas
métier réel documenté avec la source du chiffre attendu.

Les cas métier sont écrits en premier, avant l'implémentation. Un moteur fiscal faux
et joli est pire qu'une absence de fonctionnalité.
