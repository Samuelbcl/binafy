# 09 — Site public et contenu

La partie publique n'est pas une brochure : c'est le canal d'acquisition. Le modèle
qui fonctionne dans ce secteur, c'est outil gratuit + contenu de référence → compte.

## Principe

Le sujet « fiscalité belge de l'épargne et de l'investissement » est mal servi en
français. Les blogs français dominent les résultats de recherche avec du contenu
inapplicable en Belgique. C'est une position à prendre, et un dev solo peut la prendre.

**Règle absolue :** aucun texte repris d'un concurrent. Le contenu est écrit à partir
des sources officielles (SPF Finances, Région wallonne, INASTI, BNB), avec la source
citée et la date de vérification affichée. C'est à la fois ce qui protège juridiquement
et ce qui donne de la crédibilité.

## Pages piliers (à écrire dans cet ordre)

1. **Fiscalité des ETF en Belgique** — TOB, capitalisant vs distribuant, précompte,
   taxe sur les plus-values, courtier belge vs étranger. Le sujet le plus recherché et
   le plus mal traité.
2. **La taxe sur les plus-values de 2026, expliquée** — exonération annuelle, valeur de
   référence au 31/12/2025, ce qui est concerné. Sujet neuf, faible concurrence.
3. **Droits d'enregistrement en Wallonie : 3 % ou 12,5 %** — conditions, pièges,
   et l'arbitrage locatif / résidence principale. Avec le calculateur intégré.
4. **Devenir indépendant complémentaire en Belgique** — coûts réels, seuils, TVA,
   facturation électronique. Cible directe : les jeunes entrepreneurs.
5. **Rendement locatif réel en Belgique** — pourquoi on n'est pas taxé sur les loyers,
   et pourquoi le cash-flow après impôt est le seul chiffre qui compte.
6. **Compte d'épargne réglementé : taux de base et prime de fidélité** — comment un
   retrait fait perdre la prime.
7. **Épargne-pension : les deux plafonds** — mécanique, sans recommandation.

Chaque page pilier : 1 500-2 500 mots, un calculateur intégré, un schéma, les sources
en pied, la date de dernière vérification, et un lien vers l'app.

## Outils gratuits, sans compte

Ce sont les aimants à trafic. Chacun a son URL propre, son état encodé dans la query
string, et un rendu partageable.

| Outil | URL |
|---|---|
| Intérêts composés | `/outils/interets-composes` |
| Simulateur de patrimoine | `/outils/simulateur-patrimoine` |
| Capacité d'emprunt | `/outils/capacite-emprunt` |
| Frais d'acquisition immobilière (par Région) | `/outils/frais-acquisition` |
| Rendement locatif net d'impôt belge | `/outils/rendement-locatif` |
| Calculateur de budget et taux d'épargne | `/outils/budget` |
| Coût réel d'un indépendant complémentaire | `/outils/independant-complementaire` |

Les trois derniers n'existent nulle part en version belge correcte.

## Technique SEO

- Pages statiques ou ISR, rendues côté serveur
- `hreflang` fr-BE / nl-BE dès que le néerlandais arrive
- Données structurées : `FAQPage` sur les piliers, `SoftwareApplication` sur l'accueil,
  `BreadcrumbList` partout
- Un lien de partage d'une simulation doit générer une OG image avec les chiffres :
  c'est ce qui fait circuler l'outil sur Reddit et dans les groupes Facebook belges
- Sitemap automatique, canonical propre, pas de contenu dupliqué entre les Régions

## Canaux de départ

r/BEFire et r/belgium (des communautés exigeantes : arriver avec un outil utile,
pas avec une promo), les groupes Facebook d'investisseurs belges, LinkedIn via le
compte Biancola Studio. Un bon calculateur de droits d'enregistrement wallons partagé
au bon moment vaut plus que trois mois de publicité.
