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

    { type: 'titre', texte: 'L’exonération est personnelle — et ce que tu n’utilises pas ne se perd pas' },
    {
      type: 'para',
      texte:
        'Elle s’apprécie par personne, pas par ménage ni par compte : un couple qui déclare ensemble en dispose deux fois, à condition que chacun soit titulaire de ses propres positions. Et contrairement à ce qu’on lit souvent, elle ne se remet pas à zéro chaque premier janvier : la loi prévoit que la part non utilisée une année s’ajoute aux suivantes, par tranches annuelles, jusqu’à un plafond cumulé — les plus anciennes s’imputent d’abord.',
    },
    {
      type: 'piege',
      titre: 'Rien n’est automatique',
      texte:
        'Ton courtier retient le précompte au taux plein sur chaque plus-value, sans appliquer ni l’exonération ni son report. C’est dans ta déclaration que tu les réclames, pièces justificatives à l’appui — le relevé des années précédentes prouvant ce que tu n’as pas consommé. Qui ne réclame rien paie le taux plein sur tout.',
    },
    {
      type: 'note',
      titre: 'Le montant exact du report pour 2026 reste à confirmer',
      texte:
        'La loi fixe le report en montants de base à indexer, et ne garantit la valeur ronde de mille euros par an qu’à partir des revenus 2027. Pour 2026, Nestor affiche la valeur annoncée par les sources professionnelles et la marque comme non confirmée tant que l’avis officiel d’indexation ne l’a pas fixée.',
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

const DROITS_ENREGISTREMENT_WALLONIE: Guide = {
  slug: 'droits-enregistrement-wallonie',
  titre: 'Droits d’enregistrement en Wallonie : 3 % ou 12,5 %',
  resume:
    'Savoir si ton achat ouvre le taux réduit, et ce que l’ordre dans lequel tu achètes tes biens peut te coûter.',
  categorie: 'immobilier',
  niveau: 'intermediaire',
  dureeMinutes: 9,
  verifieLe: '2026-09-07',
  anneeRevenus: 2026,
  parametresLies: [
    'droits_enregistrement.propre_unique',
    'droits_enregistrement.autre',
    'droits_enregistrement.abattement',
    'droits_enregistrement.abattement_prix_max',
    'droits_enregistrement.duree_maintien_residence',
    'immobilier.tva_neuf',
  ],
  blocs: [
    {
      type: 'para',
      texte:
        'Les droits d’enregistrement se paient une seule fois, le jour de l’acte, en plus du prix du bien. C’est un pourcentage du prix d’achat versé à la Région — en Wallonie, deux taux coexistent, et l’écart entre les deux est le poste le plus lourd de tous les frais d’acquisition.',
    },
    {
      type: 'para',
      texte:
        'Ces taux ne dépendent pas d’une année de revenus mais de la date de l’acte authentique. Ce sont donc les mêmes que tu signes en janvier ou en décembre.',
    },

    { type: 'titre', texte: 'Le même bien, deux prix' },
    {
      type: 'demonstration',
      cle: 'enregistrement-taux-reduit',
      titre: 'Ta première habitation, celle où tu vas vivre',
      introduction:
        'Le taux réduit vise l’habitation propre et unique : celle que tu occupes, quand tu n’en possèdes pas d’autre.',
    },
    {
      type: 'demonstration',
      cle: 'enregistrement-taux-plein',
      titre: 'Le même bien, hors des conditions du taux réduit',
      introduction:
        'Locatif, résidence secondaire, ou simplement : tu possèdes déjà un logement. Ni le prix ni le bien n’ont changé.',
    },

    { type: 'titre', texte: 'Les quatre conditions du taux réduit' },
    {
      type: 'liste',
      items: [
        'Acquérir la pleine propriété. Le taux s’apprécie par acquéreur, à hauteur de sa part.',
        'T’y domicilier dans les trois ans si l’habitation est construite, cinq ans pour un terrain à bâtir.',
        'Y maintenir ta résidence principale trois ans à compter de cette domiciliation.',
        'Ne pas déjà posséder, en pleine propriété entière, un autre bien destiné à l’habitation — en Belgique ou ailleurs.',
      ],
    },
    {
      type: 'note',
      titre: 'Ce qui ne bloque pas le taux réduit',
      texte:
        'Un terrain non bâti, un garage ou un local commercial ne comptent pas comme habitation. Un bien détenu en nue-propriété, en usufruit, ou en indivision avec un tiers autre que ton co-acquéreur ne bloque pas non plus.',
    },

    { type: 'titre', texte: 'Le piège' },
    {
      type: 'piege',
      titre: 'Acheter un locatif avant sa résidence principale coûte le taux réduit sur celle-ci',
      texte:
        'La quatrième condition se lit au moment de l’acte sur ta résidence principale. Si tu as acheté un studio locatif deux ans plus tôt, tu ne possèdes plus une habitation unique : ta résidence principale bascule au taux plein. Le surcoût ne dépend pas du prix du locatif, seulement de celui du logement acheté ensuite.',
    },
    {
      type: 'demonstration',
      cle: 'ordre-achat-locatif-avant',
      titre: 'Ce que l’ordre d’achat coûte, en euros',
      introduction:
        'Deux achats identiques, dans l’ordre inverse. Seule la chronologie change.',
    },
    {
      type: 'para',
      texte:
        'Il existe une porte de sortie, et elle a un prix : tu peux obtenir le taux réduit sur ta résidence principale en t’engageant, dans son acte d’achat, à revendre le bien déjà possédé dans les trois ans. L’administration contrôle à l’échéance. Si la revente n’a pas eu lieu, la différence est réclamée — garder le locatif au-delà de ce délai revient au même que ne jamais s’être engagé.',
    },
    {
      type: 'para',
      texte:
        'Ce montant n’est pas un verdict : c’est le seuil que le rendement du bien acheté en premier doit dépasser pour que l’ordre choisi tienne la route. Nestor le chiffre, il ne te dit pas quoi faire.',
    },

    { type: 'titre', texte: 'Si la condition n’est plus respectée' },
    {
      type: 'para',
      texte:
        'Domiciliation manquée, résidence quittée avant trois ans, revente promise et non faite : l’administration réclame la différence entre le taux plein et le taux réduit. La documentation officielle wallonne consultée décrit ce rappel sans en détailler les intérêts de retard — ce point mérite d’être confirmé auprès de ton notaire si tu es concerné.',
    },

    { type: 'titre', texte: 'Les autres Régions, pour situer' },
    {
      type: 'para',
      texte:
        'La Flandre applique un taux réduit plus bas que la Wallonie sur l’habitation propre et unique, et un taux plein légèrement inférieur. Bruxelles procède autrement : un taux unique, corrigé par un abattement qui efface les droits sur une première tranche du prix, à condition que le prix total reste sous un plafond.',
    },
    {
      type: 'note',
      titre: 'Ce guide est wallon',
      texte:
        'Les taux des trois Régions sont dans le moteur de Nestor et vérifiés. En revanche, les conditions fines des régimes flamand et bruxellois — délais de domiciliation, définition exacte du bien unique, dégressivité éventuelle de l’abattement bruxellois — n’ont pas été vérifiées à la même profondeur. Ne te fie pas à ce guide pour un achat hors Wallonie.',
    },

    {
      type: 'outil',
      href: '/outils/frais-acquisition',
      libelle: 'Calculer mes frais d’acquisition',
      texte:
        'Le calculateur ajoute aux droits les honoraires du notaire, les frais de l’acte de crédit et l’apport, et donne le cash réellement nécessaire le jour de l’acte — dans les deux ordres d’achat possibles.',
    },

    { type: 'titre', texte: 'Ce que ce guide ne couvre pas' },
    {
      type: 'liste',
      items: [
        'L’existence d’un mécanisme wallon de portabilité des droits déjà payés : les sources officielles consultées n’en mentionnent aucun, ce qui n’est pas une preuve qu’il n’existe pas.',
        'Les intérêts de retard applicables à un rappel de droits, et le délai dont dispose l’administration pour le réclamer.',
        'L’achat en société, l’achat par un non-résident, et le sort de la quote-part du terrain dans un achat neuf sous TVA.',
      ],
    },
  ],
  suite: ['taxe-plus-values-2026'],
};

const EPARGNE_REGLEMENTEE: Guide = {
  slug: 'compte-epargne-reglemente-prime-fidelite',
  titre: 'Compte d’épargne réglementé : taux de base et prime de fidélité',
  resume:
    'Lire le taux qu’affiche ta banque pour ce qu’il est, et repérer le seul geste qui fait perdre de l’argent sans qu’elle ait touché à ses taux.',
  categorie: 'fiscalite',
  niveau: 'debutant',
  dureeMinutes: 8,
  verifieLe: '2026-09-07',
  anneeRevenus: 2026,
  parametresLies: [
    'epargne_reglementee.exoneration_interets',
    'epargne_reglementee.taux_precompte_reduit',
    'precompte_mobilier.taux',
  ],
  blocs: [
    {
      type: 'para',
      texte:
        'Un compte d’épargne réglementé porte deux rémunérations qui tournent en parallèle et n’obéissent pas aux mêmes règles. Le taux de base court chaque jour sur tout ce qui est sur le compte, dès le lendemain d’un versement, jusqu’au jour du retrait. Rien à faire pour l’obtenir.',
    },
    {
      type: 'para',
      texte:
        'La prime de fidélité est autre chose. Elle ne récompense que l’argent resté en place douze mois complets et consécutifs. Elle se calcule versement par versement, pas sur le solde : chaque euro déposé a sa propre horloge, qui démarre le jour du dépôt. Une fois les douze mois écoulés, elle est versée au premier jour du trimestre suivant, et un nouveau cycle démarre.',
    },

    { type: 'titre', texte: 'Ce que « jusqu’à X % » veut dire' },
    {
      type: 'para',
      texte:
        'Le taux mis en avant par une banque additionne souvent les deux composantes. Ce total ne se touche que sur un versement resté immobile toute une année pile — un cas peu représentatif de quelqu’un qui épargne et retire au fil des mois. Un arrêté royal impose d’ailleurs aux banques de communiquer le taux de base et la prime séparément : la confusion entre les deux n’a rien d’anecdotique.',
    },
    {
      type: 'note',
      titre: 'Les taux ne sont pas des paramètres fiscaux',
      texte:
        'Chaque banque fixe librement son taux de base et sa prime, et peut les modifier. Le taux de base peut changer à tout moment, y compris sur l’argent déjà présent, moyennant information des clients. La prime, elle, est verrouillée pour les douze mois qui suivent chaque versement : un changement annoncé aujourd’hui ne touche que les nouveaux dépôts.',
    },

    { type: 'titre', texte: 'Ce que le fisc prélève, et ce qu’il laisse' },
    {
      type: 'para',
      texte:
        'C’est ici que le mot « réglementé » compte. Un compte qui remplit les conditions légales bénéficie de deux faveurs : une première tranche d’intérêts exonérée de précompte chaque année, par personne et tous comptes réglementés confondus, puis un taux réduit sur l’excédent — au lieu du taux standard qui frappe le reste des revenus mobiliers.',
    },
    {
      type: 'demonstration',
      cle: 'epargne-reglementee-au-dela',
      titre: 'Une année d’intérêts qui dépasse l’exonération',
      introduction:
        'Seul l’excédent est taxé, et au taux réduit. Le gros des intérêts reste intact.',
    },
    {
      type: 'demonstration',
      cle: 'interets-non-reglementes',
      titre: 'Les mêmes intérêts, sur un compte non réglementé',
      introduction:
        'Compte à terme, produit d’une banque étrangère hors régime belge, compte avec frais : aucune faveur, le taux standard s’applique dès le premier euro.',
    },
    {
      type: 'note',
      titre: 'Plusieurs banques, une seule exonération',
      texte:
        'Chaque banque applique l’exonération sur son propre compte, sans savoir ce que tu touches ailleurs. Si le total de tes intérêts réglementés dépasse le plafond alors qu’aucune banque n’a rien retenu, c’est à toi de déclarer l’excédent et d’acquitter le précompte réduit.',
    },

    { type: 'titre', texte: 'Le piège' },
    {
      type: 'piege',
      titre: 'La prime se perd versement par versement, pas selon l’âge du compte',
      texte:
        'On pense souvent : « mon argent est là depuis deux ans, la prime est acquise ». Faux. L’ancienneté du compte ne protège que l’argent qui, individuellement, y est resté douze mois. Vider son compte fait perdre la prime sur tout ce qui n’avait pas encore bouclé son cycle — un versement de janvier retiré en novembre ne rapportera jamais sa prime, même si le reste du solde dort là depuis des années.',
    },
    {
      type: 'para',
      texte:
        'Une nuance utile en cas de retrait partiel : la banque impute d’abord le retrait sur les montants dont le cycle est le moins avancé. Les versements récents partent en premier, ce qui protège l’argent le plus proche de ses douze mois. Ça ne change rien pour un retrait total.',
    },
    {
      type: 'para',
      texte:
        'Nestor connaît la date de tes versements sur les comptes que tu y enregistres : il peut donc te dire, avant un retrait, ce que ce retrait te coûterait en prime.',
    },

    { type: 'titre', texte: 'Ce que ce guide ne couvre pas' },
    {
      type: 'liste',
      items: [
        'Les comptes à terme, la branche 21 et les autres produits d’épargne ou d’assurance, qui ont leurs propres règles.',
        'Le doublement du plafond d’exonération pour un couple qui déclare ensemble : mentionné par la presse spécialisée, pas encore confirmé ici à la source officielle.',
        'La liste complète des conditions qui rendent un compte « réglementé » — frais, devise, État de l’établissement.',
        'Le cas d’un compte joint entre titulaires qui ne sont ni mariés ni cohabitants légaux.',
      ],
    },
  ],
  suite: ['fiscalite-etf-belgique'],
};

const EPARGNE_PENSION: Guide = {
  slug: 'epargne-pension-deux-plafonds',
  titre: 'Épargne-pension : les deux plafonds',
  resume:
    'Calculer ce que rend chaque plafond de versement, et situer le montant à partir duquel le plafond haut redevient intéressant.',
  categorie: 'fiscalite',
  niveau: 'intermediaire',
  dureeMinutes: 8,
  verifieLe: '2026-09-07',
  anneeRevenus: 2026,
  parametresLies: [
    'epargne_pension.plafond_bas',
    'epargne_pension.reduction_bas',
    'epargne_pension.plafond_haut',
    'epargne_pension.reduction_haut',
    'epargne_pension.taxe_anticipative',
  ],
  blocs: [
    {
      type: 'para',
      texte:
        'L’épargne-pension donne droit à une réduction d’impôt sur ce que tu y verses dans l’année. Jusque-là, rien de surprenant. Ce qui surprend, c’est qu’il existe deux plafonds de versement, chacun avec son propre taux de réduction — et que le taux retenu s’applique à la totalité du versement, pas seulement à la part qui dépasse le premier plafond.',
    },
    {
      type: 'para',
      texte:
        'Ce n’est pas un barème progressif comme celui de l’impôt sur le revenu, où seule la tranche supplémentaire change de taux. Ici, verser un euro de plus que le plafond bas fait basculer tout le calcul sur un taux plus faible. C’est ce mécanisme, et lui seul, qui produit le piège de ce guide.',
    },

    { type: 'titre', texte: 'Le même effort, deux résultats' },
    {
      type: 'demonstration',
      cle: 'epargne-pension-plafond-bas',
      titre: 'Verser exactement le plafond bas',
      introduction: 'La réduction la plus élevée par euro versé.',
    },
    {
      type: 'demonstration',
      cle: 'epargne-pension-entre-deux',
      titre: 'Verser le plafond haut',
      introduction:
        'Trois cents euros de plus immobilisés. Regarde ce que la réduction gagne, elle.',
    },
    {
      type: 'note',
      titre: 'Le choix se fait à la banque, pas sur la déclaration',
      texte:
        'Pour verser au-delà du plafond bas, il faut le signaler explicitement à l’organisme qui gère le compte ou le contrat. Ce choix vaut pour l’année de revenus en cours ; pour revenir au plafond bas l’année suivante, il faut le refaire.',
    },

    { type: 'titre', texte: 'Le piège' },
    {
      type: 'piege',
      titre: 'Entre les deux plafonds, verser plus fait recevoir moins',
      texte:
        'Dès le premier euro au-dessus du plafond bas, le taux réduit s’applique à tout le versement. Il existe donc une zone entière où tu immobilises plus d’argent et reçois moins de réduction en euros que si tu t’étais arrêté au plafond bas. Il faut atteindre un point de bascule pour seulement retrouver ce que le plafond bas rendait déjà.',
    },
    {
      type: 'demonstration',
      cle: 'epargne-pension-zone-perdante',
      titre: 'Au cœur de la zone perdante',
      introduction:
        'Cent cinquante euros de plus que le plafond bas. Compare la réduction obtenue à celle du plafond bas.',
    },
    {
      type: 'demonstration',
      cle: 'epargne-pension-bascule',
      titre: 'Le point de bascule',
      introduction:
        'Le montant où le plafond haut rend enfin autant que le bas. En dessous, on perd ; au-dessus, on gagne — au maximum quelques dizaines d’euros.',
    },
    {
      type: 'para',
      texte:
        'Ce n’est pas un cas d’école. Selon des statistiques du SPF Finances relayées par l’ordre des experts-comptables, environ deux mille deux cents contribuables ont versé en 2025 un montant situé dans cette zone — et ont reçu moins qu’un versement plus faible leur aurait donné. Nestor chiffre les cinq lignes ; le montant versé, c’est toi qui le choisis.',
    },

    { type: 'titre', texte: 'Ce qui se passe à soixante ans' },
    {
      type: 'para',
      texte:
        'Ce capital n’échappe pas à l’impôt. À soixante ans, une taxe anticipative est prélevée sur le capital constitué — versements cumulés et rendement produit — que tu retires l’argent ce jour-là ou non. Son taux figure dans les paramètres vérifiés de Nestor ; le mode de calcul exact de son assiette pour les versements poursuivis après soixante ans, lui, n’y figure pas, et ce guide ne s’y engage pas.',
    },
    {
      type: 'note',
      titre: 'Fonds ou assurance, en une phrase',
      texte:
        'Un fonds d’épargne-pension place l’argent en actions et en obligations sans garantie de capital ; une assurance épargne-pension garantit un capital minimum, en échange d’un rendement généralement plus faible. La fiscalité décrite ici est la même pour les deux.',
    },

    { type: 'titre', texte: 'Ce qui bouge, et ce qui est seulement annoncé' },
    {
      type: 'para',
      texte:
        'Une circulaire de 2026 gèlerait l’indexation des deux plafonds pendant plusieurs années : ils resteraient identiques pour les revenus 2026 à 2029. Nestor n’a pas encore lu ce texte à sa source primaire — l’information vient de republications professionnelles concordantes, et elle est signalée avec cette réserve.',
    },
    {
      type: 'note',
      titre: 'Une réforme annoncée n’est pas une réforme en vigueur',
      texte:
        'Un plafond unique remplaçant les deux a été annoncé en 2026, en réaction au constat ci-dessus. Le gouvernement ne s’est pas accordé dessus à l’été ; un retour est évoqué pour l’automne. Tant que rien n’est voté ni publié, les deux plafonds décrits ici s’appliquent normalement — et Nestor ne change pas une ligne de calcul sur une annonce.',
    },

    { type: 'titre', texte: 'Ce que ce guide ne couvre pas' },
    {
      type: 'liste',
      items: [
        'L’assiette précise de la taxe anticipative — capital réel ou coefficient de conversion selon l’âge du premier versement.',
        'Le sort des versements poursuivis après soixante ans et leur traitement à la sortie définitive.',
        'L’épargne à long terme, un dispositif distinct au panier fiscal séparé, qui aura son propre guide.',
        'Les frais de gestion de chaque fonds ou assureur : ce ne sont pas des paramètres fiscaux, mais ils pèsent sur le capital constitué.',
      ],
    },
  ],
  suite: ['compte-epargne-reglemente-prime-fidelite'],
};

const RENDEMENT_LOCATIF: Guide = {
  slug: 'rendement-locatif-reel-belgique',
  titre: 'Rendement locatif réel : pourquoi on n’est pas taxé sur les loyers',
  resume:
    'Calculer ce qu’un bien loué te coûte ou te rapporte vraiment, impôt compris — et pourquoi ça change du tout au tout selon qui l’occupe.',
  categorie: 'immobilier',
  niveau: 'intermediaire',
  dureeMinutes: 8,
  verifieLe: '2026-09-07',
  anneeRevenus: 2026,
  parametresLies: [
    'rc.coefficient_indexation',
    'rc.majoration_locatif',
    'immobilier.coefficient_revalorisation',
    'immobilier.forfait_charges_professionnel',
    'ipp.tranche_3.taux',
    'droits_enregistrement.autre',
  ],
  blocs: [
    {
      type: 'para',
      texte:
        'Tout ce qui s’écrit en français sur la rentabilité locative suppose qu’on est taxé sur le loyer perçu. En Belgique, non. Quand tu loues à un particulier qui y habite, le loyer n’apparaît nulle part dans le calcul de l’impôt : la base imposable se construit à partir du revenu cadastral — une valeur administrative attribuée au bien, indexée chaque année, puis majorée.',
    },
    {
      type: 'para',
      texte:
        'Cette base s’ajoute à tes autres revenus et se taxe à ton taux marginal : le taux qui frappe ton dernier euro gagné, pas une moyenne. Deux propriétaires du même bien, au même loyer, ne paient donc pas le même impôt si leurs salaires les placent dans des tranches différentes. Et si tu occupes toi-même le bien, rien de tout ceci ne s’applique : l’habitation propre est exonérée.',
    },

    { type: 'titre', texte: 'Ce que le fisc regarde vraiment' },
    {
      type: 'demonstration',
      cle: 'impot-locatif-particulier',
      titre: 'Un studio loué à un particulier',
      introduction:
        'Le loyer sert à juger l’investissement, pas à calculer l’impôt. Regarde le taux effectif rapporté au loyer : il n’a rien à voir avec le taux marginal.',
    },
    {
      type: 'note',
      titre: 'Le piège de l’année, encore',
      texte:
        'Le coefficient d’indexation du revenu cadastral et le coefficient de revalorisation changent chaque année. Un calcul qui ne précise pas l’année de revenus peut afficher un chiffre juste — pour l’année d’à côté. Nestor raisonne en année de revenus 2026, déclarés en 2027.',
    },

    { type: 'titre', texte: 'Le piège' },
    {
      type: 'piege',
      titre: 'Le même bien, un autre locataire, un autre régime',
      texte:
        'Tout le calcul précédent suppose un locataire particulier qui occupe le bien à titre privé. Loue le même studio à une société, une profession libérale, ou pour tout usage professionnel, et le régime bascule : la base n’est plus le revenu cadastral majoré mais le loyer réel, diminué d’un forfait de charges — lui-même plafonné en fonction du revenu cadastral revalorisé. Plus le loyer est élevé par rapport au revenu cadastral, plus l’écart se creuse.',
    },
    {
      type: 'demonstration',
      cle: 'impot-locatif-professionnel',
      titre: 'Le même studio, loué à une société',
      introduction:
        'Rien n’a changé : ni le bien, ni le loyer, ni ta tranche d’impôt. Seul l’usage qu’en fait le locataire.',
    },
    {
      type: 'para',
      texte:
        'C’est pour cette raison que le champ « usage du bien » pilote tout le calcul dans Nestor : c’est la donnée qui, à elle seule, peut multiplier ton impôt sans que le loyer ait bougé d’un centime.',
    },

    { type: 'titre', texte: 'Du rendement affiché au cash-flow réel' },
    {
      type: 'para',
      texte:
        'Une annonce affiche un rendement brut : le loyer annuel divisé par le prix. Ce chiffre ignore tout ce qui sort réellement de ta poche. Les droits d’enregistrement d’un achat locatif, au taux plein, et les frais de notaire s’ajoutent au prix le jour de l’acte. Puis chaque année tombent les charges non récupérables, la vacance entre deux locataires, une provision pour travaux, et le précompte immobilier — un impôt régional distinct, dû que le bien soit loué ou vide, et qui ne se déduit pas de la base imposable.',
    },
    {
      type: 'demonstration',
      cle: 'rendement-locatif-reel',
      titre: 'Un appartement à 200 000 € en Wallonie, financé à 80 %',
      introduction:
        'Le rendement de l’annonce, puis chaque poste qui le ronge, jusqu’au cash-flow mensuel après crédit. L’amortissement du capital n’est pas une perte — c’est de l’épargne forcée — mais c’est un flux à sortir chaque mois.',
    },
    {
      type: 'para',
      texte:
        'Un cash-flow négatif n’est pas nécessairement un mauvais investissement : la revalorisation éventuelle du bien n’entre pas dans ce calcul, et une partie de l’effort rembourse ta propre dette. Mais c’est un effort à pouvoir porter, pas un rendement à afficher. Voilà ce que ce financement coûte ; le choix t’appartient.',
    },

    {
      type: 'outil',
      href: '/outils/rendement-locatif',
      libelle: 'Rejouer avec mon bien',
      texte:
        'Le calculateur applique ces formules à ton prix, ton loyer, ton revenu cadastral, ta Région, tes charges et ton crédit — avec le détail ligne par ligne et la source de chaque paramètre.',
    },

    { type: 'titre', texte: 'Ce que ce guide ne couvre pas' },
    {
      type: 'liste',
      items: [
        'Le détail des frais de notaire et de l’acte de crédit : voir le guide sur les droits d’enregistrement et l’outil Frais d’acquisition.',
        'Un bien neuf, où la TVA remplace les droits d’enregistrement.',
        'La revente : la plus-value immobilière suit un régime distinct de la taxe sur les plus-values mobilières de 2026.',
        'La détention via une société, la colocation et le bail étudiant, qui posent leurs propres questions de qualification.',
        'Les cas particuliers où le précompte immobilier devient déductible, comme le bail à ferme.',
      ],
    },
  ],
  suite: ['droits-enregistrement-wallonie'],
};

const INDEPENDANT_COMPLEMENTAIRE: Guide = {
  slug: 'independant-complementaire-belgique',
  titre: 'Devenir indépendant complémentaire : ce que ça coûte vraiment',
  resume:
    'Calculer ce qu’il te reste réellement sur une facture — pas ce qu’un simulateur de caisse te montre, qui s’arrête avant ce qui coûte le plus cher.',
  categorie: 'independant',
  niveau: 'intermediaire',
  dureeMinutes: 9,
  verifieLe: '2026-09-07',
  anneeRevenus: 2026,
  parametresLies: [
    'independant.tranche_1.taux',
    'independant.tranche_1.plafond',
    'independant.tranche_2.taux',
    'independant.tranche_2.plafond',
    'independant.seuil_cotisations_complementaire',
    'independant.revenu_plancher_principal',
    'independant.frais_gestion_caisse',
    'independant.cout_bce',
    'independant.cout_activation_tva',
    'tva.seuil_franchise',
    'ipp.tranche_3.taux',
    'ipp.additionnels_communaux_moyen',
  ],
  blocs: [
    {
      type: 'para',
      texte:
        'Un indépendant complémentaire exerce déjà une activité salariée à au moins mi-temps — ou une situation reconnue équivalente — et démarre une activité indépendante à côté. Le statut n’existe qu’en miroir de cette activité principale : sous le mi-temps, la caisse bascule l’affiliation vers le titre principal, aux cotisations plus lourdes.',
    },
    {
      type: 'para',
      texte:
        'Une fois lancé, chaque facture génère deux prélèvements distincts, calculés à des moments différents : une cotisation sociale, et un impôt. Pris séparément, ils se comprennent. C’est leur addition qui surprend — et c’est précisément l’addition que les simulateurs de caisses ne font pas.',
    },

    { type: 'titre', texte: 'Avant la première facture' },
    {
      type: 'liste',
      items: [
        'S’affilier à une caisse d’assurances sociales. L’affiliation est gratuite, mais elle doit précéder le premier jour d’activité, pas le suivre.',
        'S’inscrire à la Banque-Carrefour des Entreprises via un guichet d’entreprises — un tarif réglementé, identique partout.',
        'Activer un numéro de TVA si l’activité le demande — là, chaque guichet fixe son prix.',
      ],
    },
    {
      type: 'demonstration',
      cle: 'independant-demarrage',
      titre: 'Le coût de démarrage, payé une fois',
      introduction:
        'Deux postes, deux natures : l’inscription est une mission légale du guichet, l’activation de la TVA un service qu’il tarife librement.',
    },
    {
      type: 'note',
      titre: 'La franchise de TVA',
      texte:
        'Sous un certain chiffre d’affaires annuel, tu peux rester en franchise : pas de TVA à facturer, pas de déclaration périodique — mais pas de TVA déductible sur tes achats professionnels non plus. Le seuil figure dans les paramètres vérifiés de Nestor.',
    },

    { type: 'titre', texte: 'Les cotisations sociales' },
    {
      type: 'para',
      texte:
        'Elles suivent un barème dégressif : un premier taux sur la première tranche de revenu net, un taux plus bas sur la suivante, plus rien au-delà d’un plafond. Pour la quasi-totalité des complémentaires, seule la première tranche joue. S’y ajoutent les frais de gestion de la caisse — un tarif commercial, qui varie d’un tiers d’une enseigne à l’autre.',
    },
    {
      type: 'para',
      texte:
        'La première année, la cotisation est provisoire, calculée sur une estimation. Une fois ta déclaration traitée — deux à trois ans plus tard —, la caisse recalcule sur le revenu réel et envoie une régularisation. Un complément si tu as gagné plus que prévu ; plus rarement un remboursement.',
    },
    {
      type: 'piege',
      titre: 'Le seuil d’exemption est un couperet, pas une franchise',
      texte:
        'Sous le seuil de revenu net annuel, le complémentaire ne paie aucune cotisation. Un euro au-dessus, et la cotisation porte sur la totalité du revenu — pas sur le seul dépassement. Cent euros de revenu supplémentaire peuvent déclencher plusieurs centaines d’euros de cotisations qui n’existaient pas la veille. Contrairement au titre principal, qui cotise sur un revenu plancher même s’il gagne moins, le complémentaire n’a pas de minimum : rien en dessous, tout au-dessus.',
    },
    {
      type: 'demonstration',
      cle: 'independant-seuil-couperet',
      titre: 'Juste au-dessus du seuil',
      introduction:
        'Le revenu a franchi le seuil de peu. Regarde sur quel montant la cotisation est calculée.',
    },

    { type: 'titre', texte: 'Le piège qui coûte le plus cher' },
    {
      type: 'piege',
      titre: 'L’impôt, pas la cotisation',
      texte:
        'Les simulateurs des caisses calculent ce qu’elles prélèvent, pas ce que tu gardes. Or le revenu complémentaire s’ajoute à ton salaire et se fait taxer dans la tranche marginale du dessus, additionnels communaux compris — un prélèvement qui dépasse souvent la moitié. Rien n’est retenu à la source comme sur un salaire : c’est à toi de le mettre de côté, et la facture arrive un an plus tard.',
    },
    {
      type: 'demonstration',
      cle: 'independant-du-brut-au-net',
      titre: 'Du chiffre facturé à ce qui reste',
      introduction:
        'Le calcul complet, ligne à ligne. Le salaire imposable est une hypothèse posée pour l’exemple : le calculateur te demande le tien, à lire sur ton avertissement-extrait de rôle.',
    },
    {
      type: 'para',
      texte:
        'Ce que ce tableau ne dit pas, c’est s’il faut se lancer. Ça, personne ne peut le calculer à ta place : une activité complémentaire vaut aussi ce qu’elle t’apprend, ce qu’elle prépare, et ce qu’elle te coûte en soirées. Nestor chiffre la partie qui se chiffre.',
    },

    {
      type: 'outil',
      href: '/outils/independant-complementaire',
      libelle: 'Faire le calcul avec mes chiffres',
      texte:
        'Ta caisse, ton salaire imposable, ta commune : le calculateur va jusqu’au net et montre chaque ligne, cotisations et impôt compris.',
    },

    { type: 'titre', texte: 'Ce que ce guide ne couvre pas' },
    {
      type: 'liste',
      items: [
        'Le titre principal et les conditions de bascule d’un statut à l’autre en cours d’année.',
        'La preuve de connaissances de gestion de base, parfois exigée à l’inscription — son périmètre actuel n’a pas été vérifié ici.',
        'La facturation électronique structurée entre assujettis, et la question de savoir si elle s’impose à qui reste en franchise de TVA.',
        'Le choix entre frais réels et forfait, la sortie de la franchise de TVA, et l’exercice en société.',
      ],
    },
  ],
  suite: ['epargne-pension-deux-plafonds'],
};

export const GUIDES: readonly Guide[] = [
  FISCALITE_ETF,
  PLUS_VALUES_2026,
  DROITS_ENREGISTREMENT_WALLONIE,
  EPARGNE_REGLEMENTEE,
  EPARGNE_PENSION,
  RENDEMENT_LOCATIF,
  INDEPENDANT_COMPLEMENTAIRE,
];

export function guideParSlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function guidesParCategorie(categorie: string): readonly Guide[] {
  return GUIDES.filter((g) => g.categorie === categorie);
}
