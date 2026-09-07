import type { Guide } from './types';

/**
 * Catalogue des guides (doc 09 § pages piliers).
 *
 * Règle de rédaction : chaque guide **nomme son piège**. Un texte qui explique
 * une règle sans dire où les gens se font avoir n'apprend rien qu'une brochure
 * du SPF ne dise déjà mieux.
 *
 * Aucun montant n'est écrit dans la prose. Les chiffres arrivent par les blocs
 * `demonstration`, calculés par le moteur — voir `demonstrations.ts`.
 */

const FISCALITE_ETF: Guide = {
  slug: 'fiscalite-etf-belgique',
  titre: 'La fiscalité des ETF en Belgique',
  resume:
    'Savoir quelles taxes s’appliquent à un ETF détenu depuis la Belgique, à l’achat, pendant la détention et à la vente.',
  categorie: 'investir',
  niveau: 'debutant',
  dureeMinutes: 8,
  verifieLe: '2026-09-07',
  anneeRevenus: 2026,
  parametresLies: [
    'tob.taux.actions_etrangeres',
    'tob.taux.distribuant_belge',
    'tob.taux.capitalisant_belge',
    'precompte_mobilier.taux',
    'precompte_mobilier.exoneration_dividendes',
    'reynders.taux',
    'reynders.seuil_part_obligataire',
  ],
  blocs: [
    {
      type: 'para',
      texte:
        'La quasi-totalité de ce qui s’écrit en français sur la fiscalité des ETF vise la France : PEA, assurance-vie, flat tax. Rien de tout cela n’existe en Belgique. Un investisseur belge est soumis à trois prélèvements distincts, qui se déclenchent à des moments différents et n’ont rien à voir entre eux.',
    },
    {
      type: 'liste',
      items: [
        'À chaque ordre, la taxe sur les opérations de bourse — la TOB.',
        'Pendant la détention, le précompte mobilier sur ce que le fonds distribue.',
        'À la vente, la taxe sur les plus-values et, pour certains fonds, la taxe Reynders.',
      ],
    },
    {
      type: 'para',
      texte:
        'Prises séparément, ces trois taxes sont simples. C’est leur combinaison qui rend le sujet confus, parce qu’un choix qui réduit l’une peut augmenter l’autre.',
    },

    { type: 'titre', texte: 'À l’achat : la TOB' },
    {
      type: 'para',
      texte:
        'La TOB se paie à chaque opération, à l’achat comme à la vente, indépendamment de tout gain. Elle est due même si tu perds de l’argent. Son taux ne dépend ni du montant ni de ta situation, mais d’une seule chose : la nature du support et son inscription en Belgique.',
    },
    {
      type: 'demonstration',
      cle: 'tob-aller-retour-etf',
      titre: 'Un aller-retour de 3 000 € sur un ETF capitalisant inscrit en Belgique',
      introduction:
        'Le calcul ci-dessous est celui qu’exécute l’application, avec les taux en vigueur. Le plafond s’applique par opération, jamais sur le cumul de l’année.',
    },
    {
      type: 'piege',
      titre: 'Le réflexe « capitalisant, c’est mieux » se retourne sur la TOB',
      texte:
        'Un fonds capitalisant ne distribue rien, donc pas de précompte annuel : c’est vrai, et c’est ce qu’on lit partout. Mais s’il est inscrit à la distribution en Belgique, son taux de TOB est le plus élevé des trois — plus de dix fois celui d’un ETF coté hors registre belge. Sur un investisseur qui achète tous les mois, l’écart se compte en dizaines d’euros par an. Le même produit, inscrit ou non, ne coûte pas la même chose.',
    },
    {
      type: 'note',
      titre: 'L’inscription ne se lit pas sur l’ISIN',
      texte:
        'Un ISIN luxembourgeois peut parfaitement désigner un fonds inscrit à la distribution en Belgique, et un ISIN irlandais ne dit rien non plus. L’information officielle est la liste des fonds inscrits tenue par la FSMA. Quand Nestor ne connaît pas l’inscription d’un actif, il le signale au lieu de deviner.',
    },

    { type: 'titre', texte: 'Pendant la détention : le précompte mobilier' },
    {
      type: 'para',
      texte:
        'Un ETF distribuant verse des dividendes. Ton courtier belge en retient le précompte mobilier à la source et le verse à l’État : tu reçois un montant déjà net, sans rien avoir à déclarer. C’est commode, et c’est précisément ce qui fait perdre de l’argent à des milliers de personnes.',
    },
    {
      type: 'demonstration',
      cle: 'dividendes-recuperation',
      titre: 'Ce que la retenue à la source coûte quand on ne réclame rien',
    },
    {
      type: 'piege',
      titre: 'L’exonération ne s’applique jamais toute seule',
      texte:
        'Une première tranche de dividendes est exonérée chaque année, par personne. Mais le courtier ne peut pas l’appliquer : il ne sait pas si tu as touché des dividendes ailleurs. Il retient donc tout, et c’est à toi de réclamer le trop-perçu dans ta déclaration. Personne ne te le rappellera, et l’argent non réclamé reste acquis à l’État. Un couple qui déclare ensemble dispose de deux fois la tranche.',
    },
    {
      type: 'demonstration',
      cle: 'dividendes-petit-portefeuille',
      titre: 'Sur un portefeuille modeste, la totalité se récupère',
      introduction:
        'C’est le cas le plus fréquent chez quelqu’un qui commence, et le plus souvent oublié : le montant paraît trop petit pour valoir la peine de remplir une case.',
    },
    {
      type: 'para',
      texte:
        'Un fonds capitalisant ne distribue rien : il n’y a donc pas de précompte annuel à récupérer, ni de case à remplir. Le gain reste dans le fonds jusqu’à la vente.',
    },

    { type: 'titre', texte: 'À la vente : plus-values et taxe Reynders' },
    {
      type: 'para',
      texte:
        'Depuis 2026, la plus-value réalisée sur des actifs financiers est taxée au-delà d’une exonération annuelle. Le mécanisme et son piège principal — la valeur de référence au 31 décembre 2025 — méritent leur propre guide.',
    },
    {
      type: 'para',
      texte:
        'La taxe Reynders est plus ancienne et beaucoup moins connue. Elle vise la composante d’intérêts d’un fonds dont la part obligataire dépasse un seuil légal, et elle se prélève à la vente. Un ETF actions pur n’est pas concerné ; un fonds mixte ou obligataire l’est, et un ETF « monde » qui contient une poche obligataire peut basculer sans que rien ne le signale sur la fiche produit.',
    },
    {
      type: 'note',
      titre: 'Ce que ce guide ne couvre pas',
      texte:
        'Les comptes-titres à l’étranger, qui ajoutent une déclaration à la BNB et une déclaration de compte étranger. Les dividendes de source étrangère, qui peuvent subir une retenue dans le pays d’origine avant le précompte belge. La taxe annuelle sur les comptes-titres, qui ne concerne que les portefeuilles au-delà d’un seuil élevé. Chacun de ces sujets aura son guide.',
    },
    {
      type: 'outil',
      href: '/outils/simulateur-patrimoine',
      libelle: 'Simuler avec mes chiffres',
      texte:
        'Le simulateur applique les mêmes calculs à ton portefeuille réel, ligne par ligne, et affiche le détail de chaque prélèvement.',
    },
  ],
  suite: ['taxe-plus-values-2026'],
};

const PLUS_VALUES_2026: Guide = {
  slug: 'taxe-plus-values-2026',
  titre: 'La taxe sur les plus-values de 2026, expliquée',
  resume:
    'Comprendre ce qui est taxé depuis 2026, à partir de quel montant, et pourquoi la valeur de tes actifs au 31 décembre 2025 est le chiffre à ne pas perdre.',
  categorie: 'fiscalite',
  niveau: 'debutant',
  dureeMinutes: 7,
  verifieLe: '2026-09-07',
  anneeRevenus: 2026,
  parametresLies: ['plus_values.taux', 'plus_values.exoneration_annuelle'],
  blocs: [
    {
      type: 'para',
      texte:
        'Pendant des décennies, la Belgique n’a pas taxé les plus-values sur actions d’un particulier gérant son patrimoine en bon père de famille. C’était l’un des traits les plus caractéristiques de sa fiscalité. Ce n’est plus vrai depuis 2026.',
    },
    {
      type: 'para',
      texte:
        'Ce qui change tient en trois éléments : un taux, une exonération annuelle par personne, et une date de départ. Le reste — la manière dont on détient, chez quel courtier, en capitalisant ou en distribuant — n’entre pas dans ce calcul-ci.',
    },

    { type: 'titre', texte: 'Le cas le plus fréquent : rien à payer' },
    {
      type: 'para',
      texte:
        'L’exonération annuelle est large au regard d’un portefeuille de quelques milliers d’euros. La majorité des personnes qui commencent à investir ne paieront rien pendant plusieurs années — mais elles doivent quand même connaître le mécanisme, parce que le chiffre qui les protégera plus tard se fige maintenant.',
    },
    {
      type: 'demonstration',
      cle: 'plus-value-sous-exoneration',
      titre: 'Une plus-value de 4 200 €, seule opération de l’année',
    },
    {
      type: 'demonstration',
      cle: 'plus-value-au-dessus',
      titre: 'La même opération, au-delà de l’exonération',
      introduction:
        'Seule la part qui dépasse l’exonération est taxée : le franchissement du seuil ne rend pas la totalité imposable. C’est une confusion fréquente.',
    },

    { type: 'titre', texte: 'La valeur de référence au 31 décembre 2025' },
    {
      type: 'para',
      texte:
        'La taxe ne porte que sur la plus-value réalisée à partir du 1er janvier 2026. Tout ce que ton portefeuille avait gagné avant cette date y échappe. Pour que ce soit vrai en pratique, il faut pouvoir établir ce que valaient tes actifs au 31 décembre 2025.',
    },
    {
      type: 'piege',
      titre: 'Sans valeur de référence, la plus-value ancienne devient taxable',
      texte:
        'Si tu ne peux pas établir ce que valait une position fin 2025, le calcul repart de ton prix d’achat — et la totalité du gain, y compris celui accumulé pendant les années où il n’était pas taxable, entre dans la base. Sur une position détenue depuis longtemps, l’écart peut représenter plusieurs milliers d’euros. Ce n’est pas une subtilité de fiscaliste : c’est une donnée à retrouver dans un relevé de décembre 2025, et à noter quelque part avant qu’elle ne devienne introuvable.',
    },
    {
      type: 'para',
      texte:
        'C’est la raison pour laquelle Nestor stocke une valeur de référence 2025 sur chaque position et la réclame explicitement à la saisie. Une position sans cette valeur est signalée dans le calcul d’impôt latent, plutôt que d’être estimée en silence.',
    },

    { type: 'titre', texte: 'L’exonération est annuelle et personnelle' },
    {
      type: 'para',
      texte:
        'Elle se reconstitue chaque année civile et s’apprécie par personne, pas par ménage ni par compte. Deux conséquences pratiques : elle ne s’accumule pas d’une année sur l’autre, et un couple qui déclare ensemble en dispose deux fois — à condition que chacun soit titulaire de ses propres positions.',
    },
    {
      type: 'note',
      titre: 'Ce que ce guide ne couvre pas',
      texte:
        'Le régime des participations importantes, qui obéit à d’autres règles et d’autres taux. Les plus-values immobilières, taxées selon un régime distinct. Le sort des moins-values, dont le traitement mérite d’être vérifié à sa source avant d’être affirmé ici. Enfin, l’indexation éventuelle de l’exonération : tant qu’elle n’est pas publiée, Nestor affiche le montant en vigueur sans supposer sa revalorisation.',
    },
    {
      type: 'outil',
      href: '/outils/simulateur-patrimoine',
      libelle: 'Voir mon impôt latent',
      texte:
        'L’application calcule, position par position, ce qui resterait après taxe si tu vendais tout aujourd’hui — et signale les positions dont la valeur de référence manque.',
    },
  ],
  suite: ['fiscalite-etf-belgique'],
};

export const GUIDES: readonly Guide[] = [FISCALITE_ETF, PLUS_VALUES_2026];

export function guideParSlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function guidesParCategorie(categorie: string): readonly Guide[] {
  return GUIDES.filter((g) => g.categorie === categorie);
}
