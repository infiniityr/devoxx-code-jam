# Game Design Document — Neural Assembly Line

> Version 0.1 — MVP  
> Public cible : développeurs / ingénieurs ML  
> Plateforme : navigateur web desktop (Chrome / Firefox / Safari)  
> Stack : TypeScript 5.x strict + Phaser.io v4

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Core Loop](#2-core-loop)
3. [Ressources](#3-ressources)
4. [Bâtiments](#4-bâtiments)
5. [Recettes & Modèles IA](#5-recettes--modèles-ia)
6. [Marché libre](#6-marché-libre)
7. [Arbre technologique](#7-arbre-technologique)
8. [Convoyeurs & Logistique](#8-convoyeurs--logistique)
9. [Système d'énergie & Thermique](#9-système-dénergie--thermique)
10. [Grille & Carte](#10-grille--carte)
11. [HUD & Interface utilisateur](#11-hud--interface-utilisateur)
12. [Progression & Équilibrage](#12-progression--équilibrage)
13. [Sauvegarde](#13-sauvegarde)
14. [Stack technique](#14-stack-technique)
15. [Definition of Done — MVP](#15-definition-of-done--mvp)

---

## 1. Vue d'ensemble

### Pitch

**Neural Assembly Line** est un jeu de gestion et d'automatisation 2D en pixel art.  
Le joueur construit et optimise une usine de production de modèles d'intelligence artificielle :
extraire des ressources brutes, assembler des composants neuronaux, intégrer des architectures (Transformer, CNN, MLP),
puis vendre les modèles finis sur un marché libre dont les prix fluctuent selon l'offre et la demande.

Il n'y a pas de fin : l'objectif est d'atteindre une efficience maximale, d'explorer les compromis
entre qualité de modèle, latence, consommation énergétique et rentabilité.

### Public cible

Développeurs et ingénieurs ML qui reconnaîtront les mécaniques réelles du domaine :
VRAM limitée, memory bandwidth, FP16 vs FP32, attention heads, layers de normalisation…
Les concepts sont volontairement fidèles mais restent jouables sans expertise approfondie.

### Ton & style

- **Visuel** : pixel art coloré et lisible, interface dark avec accents néon (bleu, violet, cyan).
- **Ton** : ludique et dense en références techniques, sans narration.
- **Références** : Factorio, Satisfactory, Zachtronics.

### Métriques clés exposées en permanence

| Métrique             | Description                                  |
| -------------------- | -------------------------------------------- |
| Tokens / seconde     | Débit de production global                   |
| Latence moyenne      | Temps moyen d'inférence des modèles produits |
| Utilisation VRAM     | % de VRAM consommé par les bâtiments actifs  |
| Consommation énergie | Watts consommés vs capacité installée        |
| Qualité benchmark    | Score moyen des modèles finis (0–100)        |
| Profit / minute      | Revenus du marché après coûts opérationnels  |

**Formule de score guide** (utilisée pour le prix des modèles et le benchmark) :

```
Score = (Qualité × Débit) / (Coût_énergie + Coût_mémoire + Latence)
```

---

## 2. Core Loop

### Boucle principale (macro)

```
1. Extraire ressources brutes
       ↓
2. Transformer en composants intermédiaires
       ↓
3. Assembler des modules IA (Dense, Attention, Norm, FFN)
       ↓
4. Intégrer un modèle final (Transformer / CNN / MLP)
       ↓
5. Lancer un benchmark automatique
       ↓
6. Vendre le modèle sur le marché libre
       ↓
7. Recevoir crédits + débloquer recherches
       ↓
8. Reinvestir (nouveaux bâtiments, upgrades, expansion)
       └─→ retour à l'étape 1
```

### Boucle secondaire (micro — tension d'optimisation)

À chaque tick de simulation, le joueur doit arbitrer entre :

- **Qualité vs Coût** : ajouter plus d'attention heads augmente la qualité mais consomme plus de VRAM.
- **Débit vs Latence** : pipelining parallèle augmente les tokens/s mais introduit de la latence.
- **Énergie vs Performance** : FP16 consomme moins d'énergie mais dégrade la qualité benchmark.
- **Specialisation vs Flexibilité** : une usine spécialisée Transformer est plus efficiente mais fragile aux variations de prix du marché.

### Tempo de jeu

| Phase              | Durée estimée | Description                                       |
| ------------------ | ------------- | ------------------------------------------------- |
| Démarrage          | 0–5 min       | Pose des extracteurs et premiers convoyeurs       |
| Production basique | 5–15 min      | Premier MLP fonctionnel vendu sur le marché       |
| Optimisation       | 15–30 min     | Déblocage tech tree, réorganisation des flux      |
| Scaling            | 30–60 min     | Lignes parallèles, gestion énergie/VRAM avancée   |
| Sandbox infini     | 60 min+       | Optimisation maximale, architecture multi-modèles |

---

## 3. Ressources

### Ressources primaires (extractibles)

| Ressource       | Icône suggérée   | Description                                                     | Source                |
| --------------- | ---------------- | --------------------------------------------------------------- | --------------------- |
| **Data Shards** | 💎 fragment cyan | Matériau de base ; représente les données brutes d'entraînement | Extracteur de données |
| **Silicon**     | 🟫 puce beige    | Composant physique pour les circuits neuronaux                  | Mine de silicium      |
| **Energy**      | ⚡ éclair jaune  | Alimente tous les bâtiments actifs                              | Générateurs           |

### Ressources intermédiaires (produites)

| Ressource             | Description                                         | Produit par       |
| --------------------- | --------------------------------------------------- | ----------------- |
| **Tokens**            | Unité de traitement sémantique ; flux continu       | Tokenizer         |
| **Neurons**           | Nœuds de calcul assemblés                           | Neuron Fab        |
| **Embeddings**        | Représentations vectorielles denses                 | Embedding Encoder |
| **Attention Weights** | Matrices de pondération pour mécanismes d'attention | Attention Forge   |
| **Gradient Packets**  | Cycles d'optimisation pour améliorer la qualité     | Backprop Unit     |

### Ressources de capacité (contraintes globales, non stockées)

| Ressource            | Description                        | Gestion                                 |
| -------------------- | ---------------------------------- | --------------------------------------- |
| **VRAM**             | Mémoire GPU totale disponible      | Capacité fixe, augmentable via upgrades |
| **Memory Bandwidth** | Débit de transfert entre bâtiments | Limité par le niveau des bus de données |
| **Cooling Capacity** | Capacité de dissipation thermique  | Dépend des radiateurs installés         |

### Ressource économique

| Ressource   | Description                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------- |
| **Credits** | Monnaie du jeu ; reçus lors des ventes sur le marché ; dépensés en construction et recherche |

### Stockage

Chaque ressource intermédiaire est transportée par convoyeur et peut être stockée dans des **buffers**.
Les ressources de capacité sont des _plafonds globaux_ — elles ne s'accumulent pas.

---

## 4. Bâtiments

### Catalogue MVP (8 bâtiments)

---

#### 4.1 Data Extractor — Extracteur de données

| Propriété         | Valeur                                                  |
| ----------------- | ------------------------------------------------------- |
| Taille            | 2×2                                                     |
| Input             | Aucun (ressource naturelle)                             |
| Output            | 2 Data Shards / tick                                    |
| Coût énergie      | 5 W                                                     |
| Coût construction | 50 Credits                                              |
| Tradeoff          | Débit faible mais coût nul en ressources intermédiaires |

**Usage** : point de départ de toute chaîne de production. À placer sur les zones "Data Nodes" de la carte.

---

#### 4.2 Silicon Mine — Mine de silicium

| Propriété         | Valeur                                                           |
| ----------------- | ---------------------------------------------------------------- |
| Taille            | 2×2                                                              |
| Input             | Aucun                                                            |
| Output            | 1 Silicon / tick                                                 |
| Coût énergie      | 8 W                                                              |
| Coût construction | 60 Credits                                                       |
| Tradeoff          | Faible débit ; nécessaire pour la majorité des recettes avancées |

---

#### 4.3 Tokenizer

| Propriété         | Valeur                                                     |
| ----------------- | ---------------------------------------------------------- |
| Taille            | 2×3                                                        |
| Input             | 3 Data Shards / tick                                       |
| Output            | 5 Tokens / tick                                            |
| Coût énergie      | 12 W                                                       |
| Coût construction | 120 Credits                                                |
| VRAM consommée    | 0.5 GB                                                     |
| Tradeoff          | Conversion favorable mais fort consommateur de Data Shards |

---

#### 4.4 Neuron Fab — Fabrique de neurones

| Propriété         | Valeur                                              |
| ----------------- | --------------------------------------------------- |
| Taille            | 3×3                                                 |
| Input             | 2 Tokens + 1 Silicon / tick                         |
| Output            | 1 Neuron / tick                                     |
| Coût énergie      | 20 W                                                |
| Coût construction | 200 Credits                                         |
| VRAM consommée    | 1 GB                                                |
| Chaleur générée   | 10 units/tick                                       |
| Tradeoff          | Bâtiment central ; goulot thermique si trop groupés |

---

#### 4.5 Embedding Encoder

| Propriété         | Valeur                                                            |
| ----------------- | ----------------------------------------------------------------- |
| Taille            | 3×2                                                               |
| Input             | 4 Tokens + 2 Neurons / tick                                       |
| Output            | 1 Embedding / tick                                                |
| Coût énergie      | 25 W                                                              |
| Coût construction | 300 Credits                                                       |
| VRAM consommée    | 2 GB                                                              |
| Tradeoff          | Consomme beaucoup de VRAM ; indispensable pour Transformer et MLP |

---

#### 4.6 Attention Forge

| Propriété         | Valeur                                                                   |
| ----------------- | ------------------------------------------------------------------------ |
| Taille            | 4×3                                                                      |
| Input             | 3 Embeddings + 2 Neurons / tick                                          |
| Output            | 1 Attention Weight / tick                                                |
| Coût énergie      | 40 W                                                                     |
| Coût construction | 500 Credits                                                              |
| VRAM consommée    | 4 GB                                                                     |
| Chaleur générée   | 20 units/tick                                                            |
| Tradeoff          | Très coûteux en VRAM et énergie ; exclusif aux architectures Transformer |

---

#### 4.7 Model Integrator — Intégrateur de modèle

| Propriété         | Valeur                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| Taille            | 4×4                                                                            |
| Input             | Varie selon la recette                                                         |
| Output            | 1 Modèle fini / cycle                                                          |
| Coût énergie      | 30 W                                                                           |
| Coût construction | 800 Credits                                                                    |
| VRAM consommée    | 3 GB                                                                           |
| Tradeoff          | Un seul type de modèle configurable à la fois ; reconfiguration coûte du temps |

**Note** : le Model Integrator est le seul bâtiment à produire des modèles finaux. Il contient un selector de recette.

---

#### 4.8 Power Generator — Générateur

| Propriété         | Valeur                                                    |
| ----------------- | --------------------------------------------------------- |
| Taille            | 3×3                                                       |
| Input             | Aucun                                                     |
| Output            | +100 W de capacité énergie                                |
| Coût construction | 400 Credits                                               |
| Tradeoff          | Grande empreinte ; à placer tôt pour éviter les blackouts |

---

#### 4.9 Cooling Tower — Tour de refroidissement _(débloquée tier 2)_

| Propriété         | Valeur                                                                       |
| ----------------- | ---------------------------------------------------------------------------- |
| Taille            | 2×2                                                                          |
| Input             | 5 W énergie                                                                  |
| Output            | −20 units/tick de chaleur dans un rayon de 5 cases                           |
| Coût construction | 350 Credits                                                                  |
| Tradeoff          | Zone de refroidissement locale ; plusieurs nécessaires pour les zones denses |

---

#### 4.10 Backprop Unit _(débloquée tier 2)_

| Propriété         | Valeur                                                                       |
| ----------------- | ---------------------------------------------------------------------------- |
| Taille            | 3×3                                                                          |
| Input             | 2 Neurons + 2 Data Shards / tick                                             |
| Output            | 1 Gradient Packet / tick                                                     |
| Coût énergie      | 35 W                                                                         |
| Coût construction | 600 Credits                                                                  |
| VRAM consommée    | 2 GB                                                                         |
| Tradeoff          | Améliore la qualité des modèles adjacents ; ne produit rien de vendable seul |

---

### Règles de placement

- Un bâtiment ne peut pas chevaucher un autre ni être placé en dehors de la grille valide.
- Certains bâtiments (Extracteur, Mine) doivent être placés sur des zones de ressources marquées.
- Le rayon de chaleur d'un bâtiment est visualisé en overlay lors du placement.

---

## 5. Recettes & Modèles IA

### Principe

Chaque type de modèle a une **recette fixe**. Le Model Integrator est configuré sur une recette
et produit cycliquement un modèle fini avec des stats déterministes (+ variance de ±5% selon la saturation de la chaîne).

### Types de modèles

---

#### 5.1 MLP — Multi-Layer Perceptron

> _Architecture simple, peu coûteuse, faible qualité benchmark._

| Propriété          | Valeur                                  |
| ------------------ | --------------------------------------- |
| Recette            | 10 Neurons + 5 Embeddings / cycle       |
| Temps de cycle     | 20 ticks                                |
| Qualité benchmark  | 30–45                                   |
| Latence            | Faible (10 ms)                          |
| VRAM requise       | 4 GB                                    |
| Prix marché (base) | 200–400 Credits                         |
| Meilleur pour      | Débuter, générer des crédits rapidement |

---

#### 5.2 CNN — Convolutional Neural Network

> _Bon compromis débit / qualité pour les tâches de vision._

| Propriété          | Valeur                                      |
| ------------------ | ------------------------------------------- |
| Recette            | 8 Neurons + 4 Embeddings + 3 Tokens / cycle |
| Temps de cycle     | 25 ticks                                    |
| Qualité benchmark  | 50–65                                       |
| Latence            | Moyenne (25 ms)                             |
| VRAM requise       | 6 GB                                        |
| Prix marché (base) | 500–900 Credits                             |
| Meilleur pour      | Bon ratio qualité/énergie                   |

---

#### 5.3 Transformer

> _Architecture haut de gamme, coûteuse, très haute qualité._

| Propriété          | Valeur                                                          |
| ------------------ | --------------------------------------------------------------- |
| Recette            | 6 Attention Weights + 8 Embeddings + 4 Gradient Packets / cycle |
| Temps de cycle     | 40 ticks                                                        |
| Qualité benchmark  | 75–95                                                           |
| Latence            | Haute (80 ms)                                                   |
| VRAM requise       | 12 GB                                                           |
| Prix marché (base) | 2 000–5 000 Credits                                             |
| Meilleur pour      | Maximiser le score ; nécessite une usine avancée                |

---

#### 5.4 Lite Model _(débloqué tier 2)_

> _Version compressée d'un CNN ou MLP. Qualité réduite, latence minimale, prix de niche._

| Propriété          | Valeur                                            |
| ------------------ | ------------------------------------------------- |
| Recette            | 5 Neurons + 2 Embeddings / cycle                  |
| Temps de cycle     | 15 ticks                                          |
| Qualité benchmark  | 20–35                                             |
| Latence            | Très faible (5 ms)                                |
| VRAM requise       | 2 GB                                              |
| Prix marché (base) | 150–300 Credits                                   |
| Meilleur pour      | Exploiter les créneaux du marché à faible latence |

---

### Modificateurs de qualité

La qualité finale d'un modèle est influencée par :

| Facteur                              | Effet                                   |
| ------------------------------------ | --------------------------------------- |
| **Saturation de la chaîne** (< 100%) | Qualité −5% par convoyeur sous-alimenté |
| **Chaleur excessive** (> 80%)        | Qualité −10% et risque de stall         |
| **Gradient Packets en input**        | +qualité si Backprop Unit connectée     |
| **VRAM saturée** (> 90%)             | Stall complet — Model Integrator bloqué |
| **FP16 mode** _(upgrade tier 3)_     | Énergie −30%, qualité −8%               |

---

## 6. Marché libre

### Principe

Il n'y a pas de contrats imposés. Le joueur produit des modèles et les vend automatiquement
(ou manuellement) sur un marché dont les prix fluctuent en temps réel.

### Mécanique de prix

Chaque type de modèle a un **prix de base** et une **courbe d'offre/demande** :

```
Prix_actuel = Prix_base × Multiplicateur_demande / (1 + Offre_excédentaire × 0.1)
```

- La **demande** monte naturellement avec la progression du tech tree (le marché "évolue").
- L'**offre excédentaire** : si le joueur vend trop d'un même type en peu de temps, le prix chute.
- Les prix se rééquilibrent toutes les 60 secondes réelles.

### Stratégies de vente

| Stratégie             | Description                                                                    |
| --------------------- | ------------------------------------------------------------------------------ |
| **Vente automatique** | Chaque modèle fini est vendu immédiatement au prix courant                     |
| **Stockage & timing** | Stocker les modèles dans un buffer de sortie et vendre lors des pics           |
| **Diversification**   | Produire plusieurs types pour éviter de saturer un segment                     |
| **Spécialisation**    | Tout-transformer pour maximiser le prix unitaire, malgré le risque de suroffre |

### Tableau de prix par type (référence équilibrage)

| Modèle      | Prix min | Prix max | Volatilité  |
| ----------- | -------- | -------- | ----------- |
| MLP         | 150      | 500      | Faible      |
| CNN         | 350      | 1 200    | Moyenne     |
| Transformer | 1 500    | 6 000    | Haute       |
| Lite Model  | 100      | 400      | Très faible |

---

## 7. Arbre technologique

### Structure

L'arbre technologique est organisé en **3 tiers**. Chaque nœud se débloque en dépensant
des **Research Points**, une monnaie secondaire obtenue en vendant des modèles (1 vente = +1 RP).

### Tier 1 — Fondations _(disponible dès le départ)_

| Nœud               | Coût RP | Effet                             |
| ------------------ | ------- | --------------------------------- |
| Tokenizer Mk2      | 5       | Débit Tokenizer +50%              |
| Conveyor Speed I   | 5       | Vitesse convoyeurs +30%           |
| Buffer Capacity I  | 5       | Capacité stockage buffers ×2      |
| Power Efficiency I | 10      | Consommation énergie globale −10% |

### Tier 2 — Optimisation _(débloqué après 5 nœuds tier 1)_

| Nœud                 | Coût RP | Effet                                           |
| -------------------- | ------- | ----------------------------------------------- |
| Cooling Tower        | 15      | Débloque le bâtiment Cooling Tower              |
| Backprop Unit        | 15      | Débloque le bâtiment Backprop Unit              |
| VRAM Expansion I     | 20      | VRAM globale +4 GB                              |
| Lite Model Blueprint | 10      | Débloque la recette Lite Model                  |
| Memory Bus I         | 20      | Memory Bandwidth +25%                           |
| Parallel Processing  | 25      | Permet 2 Model Integrators actifs simultanément |

### Tier 3 — Avancé _(débloqué après 5 nœuds tier 2)_

| Nœud                  | Coût RP | Effet                                                                               |
| --------------------- | ------- | ----------------------------------------------------------------------------------- |
| FP16 Mode             | 30      | Nouveau mode sur Model Integrator : énergie −30%, qualité −8%                       |
| VRAM Expansion II     | 40      | VRAM globale +8 GB                                                                  |
| Overclocking          | 35      | Débit de production +20%, chaleur +40%                                              |
| Transformer Blueprint | 30      | Débloque la recette Transformer _(si pas encore disponible)_                        |
| Smart Routing         | 40      | Les splitters peuvent prioriser un output automatiquement                           |
| Neural Compression    | 50      | Les modèles vendus ont un bonus de qualité +5 si la chaîne est à ≥ 90% d'efficience |

---

## 8. Convoyeurs & Logistique

### Types de convoyeurs

| Type             | Vitesse          | Coût            | Débloqué              |
| ---------------- | ---------------- | --------------- | --------------------- |
| **Conveyor Mk1** | 1 item / 2 ticks | 5 Credits/case  | Tier 1                |
| **Conveyor Mk2** | 1 item / tick    | 15 Credits/case | Tech Conveyor Speed I |
| **Conveyor Mk3** | 2 items / tick   | 40 Credits/case | Tech tier 3           |

### Éléments logistiques

| Élément      | Description                                     | Taille | Coût       |
| ------------ | ----------------------------------------------- | ------ | ---------- |
| **Splitter** | Divise un flux en 2 ou 3 sorties (configurable) | 1×1    | 30 Credits |
| **Merger**   | Fusionne 2 flux entrants en 1 sortie            | 1×1    | 30 Credits |
| **Buffer**   | Stocke jusqu'à 50 items (Mk1) ; augmentable     | 1×1    | 50 Credits |
| **Filter**   | Laisse passer uniquement un type de ressource   | 1×1    | 80 Credits |

### Saturation & goulots

- Un convoyeur à **100% de capacité** est affiché en **rouge**.
- Un convoyeur à **50–99%** est affiché en **orange**.
- Un convoyeur à **< 50%** est affiché en **vert**.
- Un convoyeur **vide** (stall en aval) est affiché en **gris clignotant**.

Ces couleurs s'affichent en temps réel sur la grille sans overlay supplémentaire.

---

## 9. Système d'énergie & Thermique

### Énergie

**Règle** : la somme de la consommation de tous les bâtiments actifs ne doit pas dépasser la capacité totale des générateurs.

| Situation                     | Conséquence                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Consommation ≤ capacité       | Fonctionnement normal                                                           |
| Consommation entre 90 et 100% | Alerte orange dans le HUD                                                       |
| Consommation > capacité       | Blackout partiel : les bâtiments les plus récents sont mis en pause en priorité |

**Indicateur visuel** : les bâtiments en sous-tension ont une icône ⚡🔴 au-dessus d'eux.

### Thermique

Certains bâtiments génèrent de la chaleur par tick. La chaleur s'accumule dans une zone locale (rayon de 3 cases).

| Température locale | Effet                                                          |
| ------------------ | -------------------------------------------------------------- |
| < 60%              | Normal                                                         |
| 60–80%             | Malus de qualité −5% sur les bâtiments dans la zone            |
| 80–100%            | Stall possible (10% de chance par tick) + malus qualité −15%   |
| > 100%             | Stall garanti ; bâtiment mis en pause jusqu'au refroidissement |

**Indicateur visuel** : overlay thermique actif en permanence via une teinte rouge/orange sur les cases chaudes.  
La Cooling Tower réduit la température dans un rayon de 5 cases.

---

## 10. Grille & Carte

### Structure

- Grille de tuiles carrées de **32×32 px** (pixel art).
- Carte effective : **256×256 tuiles** (très grande, défilable).
- Le joueur démarre au centre (coordonnées 128,128).

### Zones spéciales

| Zone              | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| **Data Nodes**    | Cases marquées où seuls les Data Extractors peuvent être posés |
| **Silicon Veins** | Cases marquées pour les Silicon Mines                          |
| **Open Space**    | Cases libres pour tous les autres bâtiments                    |

Les zones de ressources sont distribuées aléatoirement à la génération de la carte (seed fixe ou aléatoire au choix au démarrage).

### Navigation

- **Zoom** : molette de la souris, niveaux 0.25× à 4×.
- **Pan** : clic droit maintenu + glisser, ou touches WASD / flèches.
- **Minimap** : en bas à droite, affiche les zones de ressources et les clusters de bâtiments.

### Placement

- Mode placement activé via le panel de construction ou un raccourci clavier.
- Preview transparente du bâtiment sous le curseur (vert = valide, rouge = invalide).
- Clic gauche pour poser, Echap pour annuler.
- Rotation des convoyeurs : R (90° dans le sens horaire).

---

## 11. HUD & Interface utilisateur

### Barre de métriques (haut de l'écran)

Affichée en permanence, mise à jour toutes les secondes :

```
[⚡ 340/500 W]  [🧠 8.2 GB VRAM / 12 GB]  [🌡 42°]  [💎 1 240 Credits]  [📈 127 TPS]  [⏱ 32ms lat.]
```

### Panel de construction (côté gauche)

- Liste des bâtiments disponibles avec leur coût.
- Filtrés par catégorie : Production / Logistique / Énergie / Recherche.
- Grisés si non débloqués ou insuffisamment de crédits.

### Panel d'information bâtiment (clic sur un bâtiment)

- Inputs / Outputs en temps réel (items/tick actuels vs théoriques).
- Saturation de chaque port en pourcentage.
- Chaleur générée, VRAM consommée, énergie consommée.
- Bouton de démolition (remboursement 50%).
- Bouton de configuration (recette pour le Model Integrator, priorité pour les splitters).

### Panel Tech Tree (touche T)

- Vue arborescente avec nœuds verrouillés/débloqués.
- Coût RP affiché sur chaque nœud.
- Indicateur du total de RP disponibles en haut.

### Panel Marché (touche M)

- Graphique de prix en temps réel pour chaque type de modèle (fenêtre 5 min).
- Volume vendu par type.
- Toggle vente automatique / manuelle par type.

### Overlays de diagnostic (touches 1–4)

| Touche | Overlay                                                                        |
| ------ | ------------------------------------------------------------------------------ |
| 1      | Vue débit (couleurs de saturation sur convoyeurs) — **actif par défaut**       |
| 2      | Vue thermique (gradient de couleur par température)                            |
| 3      | Vue VRAM (intensité proportionnelle à la consommation VRAM de chaque bâtiment) |
| 4      | Vue énergie (bâtiments en sous-tension mis en évidence)                        |

### Alertes actionnables

Les alertes apparaissent en haut à droite, sous forme de toasts avec cause + suggestion :

> ⚠️ **Goulot détecté** — Neuron Fab #3 saturée. Ajouter un Neuron Fab ou upgrader les convoyeurs en amont.

> ⚠️ **Surchauffe** — Zone (45, 32) à 87°. Placer une Cooling Tower à proximité.

> ⚠️ **Blackout imminent** — Capacité énergie à 93%. Ajouter un Power Generator.

---

## 12. Progression & Équilibrage

### Courbe de progression cible

| Session | Objectif joueur                   | Milestones                                                                      |
| ------- | --------------------------------- | ------------------------------------------------------------------------------- |
| 10 min  | Premier modèle MLP vendu          | Extracteur + Tokenizer + Neuron Fab + Embedding + Model Integrator fonctionnels |
| 30 min  | Chaîne CNN stable et profitable   | Tech tree tier 1 partiellement débloqué, gestion énergie active                 |
| 60 min  | Première Transformer produite     | Tech tier 2 débloqué, Cooling Tower en place, 2 Model Integrators parallèles    |
| 90 min+ | Optimisation max, multiple lignes | Tech tier 3, gestion VRAM avancée, diversification marché                       |

### Principes d'équilibrage

- Chaque bâtiment doit avoir un **rôle clair** et un **tradeoff explicite** (qualité vs coût, débit vs énergie).
- Aucun upgrade ne doit être strictement dominant : FP16 est moins bon en qualité, Overclocking génère de la chaleur.
- Les goulots doivent être **diagnostiquables en 30 secondes** via les overlays.
- Le joueur ne doit jamais être bloqué de façon opaque : chaque stall a une cause visible.

### Formule d'efficience globale (indicateur interne)

```
Efficience = (Modèles_produits / tick) / (VRAM_utilisée + Énergie_consommée / 100)
```

Utilisée pour calculer le bonus Neural Compression (tech tier 3).

---

## 13. Sauvegarde

### Format

Sauvegarde en **JSON** dans le `localStorage` du navigateur.

Structure de fichier de sauvegarde :

```json
{
  "version": "0.1",
  "seed": 42,
  "ticks": 12340,
  "credits": 5200,
  "researchPoints": 47,
  "unlockedTech": ["tokenizer_mk2", "conveyor_speed_1"],
  "vramCapacity": 16,
  "buildings": [
    { "id": "data_extractor_1", "type": "DataExtractor", "x": 5, "y": 8 },
    ...
  ],
  "conveyors": [
    { "x": 7, "y": 8, "direction": "RIGHT" },
    ...
  ],
  "marketHistory": { "mlp": [200, 215, 190], "cnn": [600, 580, 620], ... }
}
```

### Politique de sauvegarde

| Mécanisme               | Détail                                                    |
| ----------------------- | --------------------------------------------------------- |
| **Autosave**            | Toutes les 5 minutes (configurable dans les options)      |
| **Sauvegarde manuelle** | Touche S ou bouton dans le menu pause                     |
| **Slots**               | 3 slots de sauvegarde                                     |
| **Export / Import**     | Bouton pour télécharger le fichier JSON ou en importer un |

### Chargement

- Menu principal avec liste des 3 slots (affiche la date/heure et le nombre de ticks joués).
- Chargement automatique du dernier autosave si le navigateur est rechargé pendant une partie.

---

## 14. Stack technique

### Langages & frameworks

| Élément       | Choix                        | Raison                                                      |
| ------------- | ---------------------------- | ----------------------------------------------------------- |
| Langage       | TypeScript 5.x (strict mode) | Typage fort, meilleure lisibilité du domaine                |
| Moteur de jeu | Phaser.io v4                 | Scènes, input, tweens, cameras ; bien adapté à la grille 2D |
| Build         | Vite                         | HMR rapide, configuration minimale                          |
| Tests         | Vitest                       | Léger, compatible ESM, idéal pour tester la simulation      |

### Architecture des dossiers

```
src/
├── simulation/        # Tick engine, flux de ressources, économie
│   ├── tick.ts        # updateTick() — appelé à 10 TPS fixes
│   ├── flowNetwork.ts # Calcul des flux sur les convoyeurs
│   └── market.ts      # Prix, offre/demande
├── entities/          # Définitions typées des entités
│   ├── Building.ts    # Classe mutable : état, ports, santé
│   ├── Conveyor.ts
│   ├── Recipe.ts      # Types de recettes (data-driven)
│   └── Contract.ts    # (réservé pour extension future)
├── data/              # Configs JSON statiques (readonly)
│   ├── buildings.json
│   ├── recipes.json
│   └── techTree.json
├── ui/                # HUD, panels, overlays
│   ├── HUD.ts
│   ├── BuildPanel.ts
│   └── Overlays.ts
└── rendering/         # Map, sprites, animations Phaser
    ├── GridRenderer.ts
    ├── BuildingSprite.ts
    └── ConveyorAnim.ts
```

### Simulation

- Timestep fixe à **10 ticks / seconde** (`setInterval` découplé du rendu Phaser).
- La logique de simulation est **découplée du rendu** : `simulation/` ne connaît pas Phaser.
- Les résultats de la simulation sont émis via `EventBus` vers le rendu et le HUD.
- Les fonctions de calcul de flux et d'économie sont des **fonctions pures** testables.

### Conventions TypeScript

```typescript
// Interfaces (I prefix)
interface IBuilding {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
}

// Enums pour les constantes
enum ResourceType {
  DataShard,
  Silicon,
  Token,
  Neuron,
  Embedding,
  AttentionWeight,
  GradientPacket,
  Credits,
}

// Types pour configs JSON
type BuildingConfig = Readonly<{
  type: BuildingType;
  width: number;
  height: number;
  energyCost: number;
}>;

// Classes pour entités mutables
class Building implements IBuilding {
  /* état mutable */
}
```

---

## 15. Definition of Done — MVP

Le MVP est considéré jouable et livrable quand :

### Fonctionnel

- [ ] Une partie complète est jouable de bout en bout.
- [ ] Au moins un cycle complet : **extraction → transformation → assemblage → vente** fonctionne.
- [ ] Les 8 bâtiments de base sont implémentés et fonctionnels.
- [ ] Les 3 types de modèles (MLP, CNN, Transformer) sont produisibles.
- [ ] Le marché libre affiche des prix et reçoit les ventes.
- [ ] Le tech tree tier 1 et tier 2 sont débloquables et actifs.
- [ ] Convoyeurs, splitters, buffers fonctionnent correctement.

### Métriques & UI

- [ ] Les 6 métriques globales sont visibles et cohérentes en temps réel.
- [ ] Les overlays de diagnostic (débit, thermique, VRAM, énergie) fonctionnent.
- [ ] Les alertes actionnables s'affichent avec cause et suggestion.
- [ ] Le panel d'information bâtiment affiche les flux en temps réel.

### Stabilité & Performance

- [ ] Aucun crash ou blocage majeur de progression.
- [ ] Performance correcte sur navigateur desktop moderne (60 FPS stable avec ≥ 100 bâtiments).
- [ ] La sauvegarde / chargement fonctionne (autosave + manuel).

### Qualité code

- [ ] TypeScript strict — 0 erreur de compilation.
- [ ] Tests unitaires couvrant la simulation (tick, flux, calcul économique).
- [ ] Fichiers courts et focalisés (< 200 lignes par fichier idéalement).
- [ ] Aucune logique métier dans le code de rendu.

---

_GDD généré le 2026-04-22 — Neural Assembly Line v0.1 MVP_
