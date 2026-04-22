# TODO — Neural Assembly Line

> Écart entre le GDD v0.1 et l'implémentation actuelle.

---

## 🔴 Critique — Bloquant pour le MVP

### Bâtiments manquants (GDD §4)

- [ ] **Cooling Tower** — ajouter dans `BuildingType`, `buildings.json`, logique de refroidissement de zone (−20 heat/tick dans un rayon de 5 cases), débloqué via tech tier 2 `cooling_tower`
- [ ] **Backprop Unit** — ajouter dans `BuildingType`, `buildings.json` (inputs: 2 Neurons + 2 DataShards, output: 1 GradientPacket), débloqué via tech tier 2 `backprop_unit`
  > ⚠️ Sans Backprop Unit, la recette Transformer est impossible (elle requiert des `GradientPacket`)

### Logistique manquante (GDD §8)

- [ ] **Splitter** — bâtiment 1×1, divise un flux entrant en 2 ou 3 sorties configurables (30 Credits)
- [ ] **Merger** — bâtiment 1×1, fusionne 2 flux entrants en 1 sortie (30 Credits)
- [ ] **Buffer** — bâtiment 1×1, stocke jusqu'à 50 items (Mk1), augmentable via tech (50 Credits)
- [ ] **Filter** — bâtiment 1×1, ne laisse passer qu'un type de ressource configurable (80 Credits)
- [ ] **Conveyor Mk3** — rendre constructible depuis le BuildPanel (2 items/tick, 40 Credits/case, débloqué tier 3)

---

## 🟠 Important — Mécaniques cœur incomplètes

### Tech Tree Tier 3 absent (GDD §7)

- [ ] Ajouter les 6 nœuds tier 3 dans `techTree.json` et `techTree.ts` (débloqué après 5 nœuds tier 2) :
  - [ ] `fp16_mode` — Coût 30 RP — nouveau mode sur Model Integrator : énergie −30%, qualité −8%
  - [ ] `vram_expansion_2` — Coût 40 RP — VRAM globale +8 GB
  - [ ] `overclocking` — Coût 35 RP — débit +20%, chaleur +40%
  - [ ] `transformer_blueprint` — Coût 30 RP — débloque la recette Transformer si pas encore disponible
  - [ ] `smart_routing` — Coût 40 RP — les splitters peuvent prioriser un output automatiquement
  - [ ] `neural_compression` — Coût 50 RP — bonus qualité +5 si chaîne ≥ 90% d'efficience

### Modificateurs de qualité incomplets (GDD §5)

- [ ] **Saturation de chaîne** — appliquer −5% de qualité par port d'input sous-alimenté (< 100% de saturation) dans `processIntegrator`
- [ ] **VRAM > 90%** → stall complet du Model Integrator (bloquer la production, pas seulement avertir)
- [ ] **Gradient Packets** → bonus qualité si le buffer du Model Integrator contient des GradientPackets en input
- [ ] **FP16 Mode** (tier 3) — implémenter le modificateur énergie/qualité sur le Model Integrator

### Convoyeurs — couleur clignotante (GDD §8)

- [ ] **Clignotement gris** pour les convoyeurs en stall (saturation = 0 et bâtiment aval plein) — actuellement couleur grise fixe

---

## 🟡 HUD & Interface (GDD §1 & §11)

### Métriques manquantes dans la barre HUD

- [ ] **Qualité benchmark** — score moyen des 10 derniers modèles vendus (0–100), à calculer dans `GameState` et afficher dans `HUD.ts`
- [ ] **Profit/minute** — revenus des ventes sur les 60 dernières secondes réelles, à traquer dans `GameState`
- [ ] **Température globale** (🌡) — chaleur maximale ou moyenne des bâtiments, visible dans le HUD

### Alertes actionnables manquantes (GDD §11)

- [ ] `⚠️ Goulot détecté` — identifier le bâtiment avec le port le plus saturé, afficher son nom + suggestion ("Ajouter un X ou upgrader les convoyeurs en amont")
- [ ] `⚠️ Surchauffe zone (x, y)` — détecter les zones à > 80% de chaleur et suggérer une Cooling Tower

---

## 🟡 Carte & Navigation (GDD §10)

- [ ] **Minimap** — affichage en bas à droite, montrant les zones de ressources et clusters de bâtiments
- [ ] **Taille de grille** — actuellement 32×32 tuiles, le GDD prévoit 256×256 (évaluer l'impact sur les perfs avant d'agrandir)

---

## 🟡 Marché (GDD §6)

- [ ] **Demande évolutive** — augmenter le `demandMultiplier` progressivement à mesure que le joueur débloque des nœuds du tech tree
- [ ] **Vente manuelle correcte** — le bouton "Vendre manuellement" utilise actuellement une qualité codée en dur à 75 ; utiliser la qualité réelle du dernier modèle produit (ou un stock de modèles finis)

---

## 🔵 Sauvegarde (GDD §13)

- [ ] **3 slots de sauvegarde** — actuellement 1 seul slot (`neural_assembly_autosave`)
- [ ] **Export / Import JSON** — bouton pour télécharger la sauvegarde ou en importer une
- [ ] **Menu principal** — écran listant les slots (date/heure, nombre de ticks joués) avant de démarrer une partie

---

## 🔵 Qualité du code (GDD §15 DoD)

- [ ] Vérifier que `tsconfig.json` est bien en mode **strict** (et corriger les éventuelles erreurs)
- [ ] Compléter les **tests unitaires** : coverage sur `thermal.ts`, `techTree.ts`, `save.ts`, et les nouveaux bâtiments logistiques
- [ ] Mesurer les **performances** avec 100+ bâtiments actifs (cible : 60 FPS stables)

---

_Généré le 2026-04-22 — à partir du GDD v0.1_
