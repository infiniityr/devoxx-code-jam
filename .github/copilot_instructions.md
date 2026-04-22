# Copilot Instructions - Neural Assembly Line

## Contexte Projet

Neural Assembly Line est un jeu 2D web de type automatisation inspire de Factorio, centre sur la construction de chaines de production IA.
Le joueur assemble des composants neuronaux (embeddings, attention heads, layers, modules) pour livrer des modeles performants.

## Vision Produit

- Gameplay principal: construire, optimiser, scaler.
- Tension principale: qualite vs cout vs latence vs energie.
- Cible: prototype jouable rapide, lisible, amusant, avec profondeur d optimisation.

## Core Loop

1. Collecter des ressources de base (silicium, energie, data shards).
2. Transformer en composants IA intermediaires.
3. Assembler des modules (dense, attention, normalization, feed-forward).
4. Integrer un modele final.
5. Lancer benchmark ou contrat client.
6. Recevoir credits, reputation et stats de performance.
7. Reinvestir en upgrades et reconfiguration de l usine.

## Piliers Design

- Lisibilite visuelle des flux de production.
- Goulots d etranglement clairs (VRAM, bandwidth memoire, chaleur, energie).
- Choix strategiques significatifs, pas juste agrandir la base.
- Feedback rapide via metrics en temps reel.

## Ressources De Jeu

- Data shards
- Tokens
- Neurons
- VRAM
- Memory bandwidth
- Energy
- Cooling capacity
- Credits

## Metrics Globales

Toujours exposer au joueur:

- Tokens per second
- Latence moyenne
- Utilisation VRAM
- Consommation energie
- Qualite benchmark
- Profit par minute

Formule guide (a ajuster en equilibrage):

Score = (Qualite \* Debit) / (Cout energie + Cout memoire + Latence)

## Scope MVP

Le MVP doit inclure:

- Carte grille 2D
- Placement de batiments
- Convoyeurs + splitters + buffers
- 8 a 10 batiments
- 5 a 8 ressources
- 3 types de contrats clients
- Systeme energie + chaleur
- Sauvegarde locale

## Stack Technique Recommandee

- **TypeScript 5.x+**
  - Strict mode active (strictNullChecks, noImplicitAny)
  - Enums pour ressources, etats, types batiments
  - Types destructures pour data-driven configs
  - Interfaces pour entites (Building, Item, Contract, Recipe)
  - Pas d'any, utiliser unknown si vraiment necessaire
- **Phaser.io v4**
  - Scene-based architecture (SceneA, SceneB, etc.)
  - Game Object pour graphiques et sprites
  - Input/keyboard manage par Phaser
  - Physics (optionnel: utiliser pour grille et collision)
  - Events pour communication entre scenes
  - Tween pour animations lisses
- Simulation en ticks fixes (ex: 10 ticks/seconde)
  - Timestep constant dans Scene.update()
  - Logique decouplee du rendu (simulation → update)
- Data-driven configs JSON pour batiments, recettes, upgrades
  - Charger via Phaser.Loader
  - Schemas JSON types

## Architecture Code

Favoriser une architecture simple et modulaire:

- simulation/: logique de tick, flux, reseaux, economie
- entities/: batiments, items, recettes, contrats
- ui/: HUD, panneaux, overlays thermiques
- rendering/: map, sprites, animations
- data/: defs statiques (buildings, tech tree, recipes)

## Patterns Phaser.io v4 A Utiliser

- **Scene principale**: herite de Phaser.Scene, gere Game, Sprites, UI
- **Game Objects**: Image, Text, Rectangle pour grille, items, batiments
- **Events**: this.events.emit() pour communication simulation → UI
- **Cameras**: utiliser pour zoom/pan sur la grille
- **Input**: this.input.on('pointerdown') pour placement batiments
- **Tweens**: pour feedback visuel smoothe (assemblage, defaillance)
- **Tiered Update**:
  - preUpdate(): lire inputs
  - update(): tick simulation, recalculer metrics
  - postUpdate(): sync rendering avec etat simulation

## Conventions TypeScript

- Interfaces avec I prefix (ex: IBuilding, IContract)
- Enums pour etats constants (ex: enum ResourceType { Energy, Neurons, VRAM, ... })
- Types pour configs JSON plutot que classes lourdes
- Utiliser readonly pour donnees statiques
- Classes pour entites mutables (Building, Item, Conveyor)
- Eviter classes generiques compliquees, preferer composition
- Prioriser un code lisible et testable.
- Eviter la logique metier dans le rendu.
- Ajouter des commentaires courts uniquement quand necessaire.
- Ecrire des fonctions pures pour le coeur de simulation quand possible.
- Eviter les abstractions prematurees.

## Equilibrage

- Tout batiment doit avoir un role clair et un tradeoff.
- Eviter les upgrades strictement dominants.
- Introduire de vrais choix: performance brute vs efficience energetique.
- Tester les boucles de progression sur sessions 10, 30, 60 minutes.

## UX

- Le joueur doit comprendre pourquoi une ligne bloque.
- Ajouter des vues de diagnostic: chaleur, energie, debit, saturation VRAM.
- Les alertes doivent etre actionnables (cause + solution suggeree).

## Evenements Dynamiques

Prevoir des evenements pour forcer l adaptation:

- Panne de refroidissement
- Pic de cout energie
- Drift data
- Rush client

## Priorites Copilot

Quand tu proposes du code:

1. Commencer par un MVP vertical jouable.
2. Fournir des structures de donnees stables avant l UI avancee.
3. Ajouter des tests sur la simulation et les calculs economiques.
4. Garder les fichiers courts et focalises.

## Definition Of Done (MVP)

- Une partie complete jouable de bout en bout.
- Au moins un cycle complet extraction -> transformation -> assemblage -> livraison.
- Metrics visibles et coherentes.
- Aucun blocage majeur de progression.
- Performance correcte sur navigateur desktop moderne.
