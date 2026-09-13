# markmap-vertical — documentation et procédure de reproduction

Moteur des cartes mentales publiées sur `www.profauda.fr/schemas` (dépôt GitHub `rollauda/schemas`, dossier `cartes/`). Il s'agit de [markmap](https://markmap.js.org) (bibliothèque `markmap-view` 0.18.12) **modifié par un script de patch** pour dessiner de haut en bas, complété par une **surcouche pédagogique** (schéma à trous « pas à pas », impression, barre d'outils, thème sombre). Aucun CDN : tout est servi localement.

Ce document décrit ce qui a été construit (12 septembre 2026), pourquoi, et comment le reproduire sur une autre machine, un autre dépôt ou une autre version de markmap.

## 1. Le problème

Markmap ne propose pas d'orientation verticale (issue #330 et discussion #311 du dépôt markmap, sans réponse). Les cartes de philosophie, très larges en horizontal (`nature` : 4 391 px), n'étaient pas lisibles en classe ni intégrables dans une page de site.

Contraintes retenues :

- **ne pas forker** markmap : la syntaxe des fichiers `.md` doit rester exactement celle de markmap, et une montée de version doit rester possible ;
- **tout en local** : pas de CDN, pour que les cartes fonctionnent hors ligne et dans une iframe sans dépendance externe ;
- **usage pédagogique** : cacher des nœuds et les révéler un à un, imprimer une fiche à compléter.

## 2. Architecture en trois couches

```
markmap-view 0.18.12 (npm, non modifié dans node_modules/)
        │
        │  patch.mjs — 21 remplacements textuels contrôlés
        ▼
lib/markmap-view-vertical.js      ← GÉNÉRÉ, ne jamais éditer
        +
lib/markmap-extras.js / .css      ← surcouche écrite à la main (source)
        +
build.mjs / build-all.mjs         ← .md → .html autonome (source)
        ▼
cartes/*.html + cartes/lib/        ← GÉNÉRÉS, ne jamais éditer
```

| Couche | Fichier | Statut | Rôle |
|---|---|---|---|
| Moteur | `patch.mjs` | source | Lit `node_modules/markmap-view/dist/browser/index.js`, applique 21 remplacements, écrit `lib/markmap-view-vertical.js`. **Échoue si un remplacement ne trouve pas exactement une occurrence** (garde-fou contre un bundle qui aurait changé). |
| Moteur | `lib/markmap-view-vertical.js` | généré | markmap-view avec l'option `direction: "TB" \| "LR"` et les feuilles empilées. |
| Surcouche | `lib/markmap-extras.js` | source | Démarrage de la carte, mode pas à pas, barre d'outils, clavier, impression, paramètres d'URL. Expose `window.markmapExtras.demarrer(svg, arbre, options)`. |
| Surcouche | `lib/markmap-extras.css` | source | Thème clair/sombre, nœuds encadrés en vertical, hachures des trous, barre, règles d'impression. |
| Build | `build.mjs` | source | Une carte : transforme le `.md` avec `markmap-lib`, embarque l'arbre JSON dans un `.html` autonome, copie `lib/` (d3 + moteur + extras). |
| Build | `build-all.mjs` | source | Boucle sur un dossier de cartes. |
| Config | `package.json` / `package-lock.json` | source | Versions **épinglées** : `d3 7.9.0`, `markmap-lib 0.18.12`, `markmap-view 0.18.12`. |

Le principe : **rien n'est modifié à la main dans le code de markmap**. Le patch est rejouable, et si markmap change, il casse bruyamment au lieu de produire un fichier à moitié modifié.

## 3. Ce que fait le patch (les 21 remplacements)

Tous portent sur le bundle navigateur `dist/browser/index.js`. Chaque remplacement est nommé dans `patch.mjs` ; le nom sert de message d'erreur si l'ancre n'est plus trouvée.

### 3.1 Option `direction` (2 remplacements)

| Nom | Effet |
|---|---|
| `options-defaut` | Ajoute `direction: "LR"` aux options par défaut (comportement d'origine conservé par défaut). |
| `derive-options` | `deriveOptions()` accepte `direction: TB \| LR` depuis le frontmatter `markmap:`. |

### 3.2 Forme des liens (1 remplacement)

| Nom | Effet |
|---|---|
| `forme-lien` | Remplace l'unique `d3.linkHorizontal()` par deux formes, `linkShapeH` et `linkShapeV`. |

### 3.3 Mise en page flextree (4 remplacements)

En vertical, flextree travaille dans son sens naturel : `x` = largeur, `y` = profondeur. En horizontal, markmap inverse les axes ; le patch ajoute une branche `isTB` à chaque endroit.

| Nom | Effet |
|---|---|
| `layout-debut` | Calcule `isTB` une fois au début de `layout()`. |
| `layout-taille` | `nodeSize` : en TB, `[largeur + 2·paddingX, hauteur + spacingVertical]`. |
| `layout-espacement` | `spacing` : en TB, `spacingHorizontal` entre frères, le double entre cousins. |
| `layout-rect` | `state.rect` : en TB, `x` centré sur `fnode.x`, `y = fnode.y`. |

### 3.4 Rendu (7 remplacements)

| Nom | Effet |
|---|---|
| `rendu-debut` | Choisit `linkShape` selon `isTB` ; pose la classe CSS `markmap-tb` sur le `<svg>` (utilisée par la surcouche). |
| `lien-entree` / `lien-sortie` | Point d'attache des liens pendant les animations : milieu du bas du nœud en TB, coin droit en LR. |
| `noeud-entree` / `noeud-sortie` | Position d'apparition/disparition des nœuds : centrée sous le parent en TB. |
| `souligne` | Supprime le trait souligné sous le texte en TB (`stroke-width: 0`) : les nœuds sont encadrés par le CSS. |
| `cercle` | Cercle de pliage centré sous le nœud en TB. |
| `lien-trace` | Tracé du lien : de `(centre, bas)` du parent à `(centre, haut)` de l'enfant en TB. |

### 3.5 Feuilles empilées (5 remplacements)

C'est la modification qui divise la largeur des cartes par 2 à 3. En vertical, les **feuilles** (nœuds sans enfants) d'un même parent sont empilées en colonne, décalées à droite, reliées par une ligne en équerre de la couleur du parent. Les nœuds qui ont des enfants restent côte à côte.

Mécanisme : dans la fonction `children` passée à flextree, les feuilles sont retirées et remplacées par **un nœud synthétique `__pile`** inséré à la position de la première feuille. Flextree calcule une seule boîte pour la pile ; le patch redistribue ensuite les rectangles de chaque feuille dans cette boîte.

| Nom | Effet |
|---|---|
| `pile-constantes` | `PILE_RETRAIT = 22` (décalage horizontal de la colonne), `PILE_ECART = 8` (entre feuilles), `largeurNoeud()`. |
| `pile-enfants` | Construction du nœud `__pile` (si au moins 2 feuilles) et calcul de sa taille. |
| `pile-rects` | Après layout : rectangles des feuilles dans la pile, point d'équerre stocké dans `state.empile`. |
| `pile-lien` | Tracé du lien vers une feuille empilée : courbe jusqu'à la verticale de la colonne, puis `V` et `H` en équerre jusqu'au bord gauche du nœud. |
| `pile-couleur` | Couleur du lien vers une feuille empilée = couleur du **parent** (et non de la feuille). |

Résultat mesuré : `nature` passe de 4 391 px à 1 421 px de large.

## 4. La surcouche `markmap-extras`

`demarrer(svg, arbre, options)` crée la carte via `markmap.Markmap.create` puis ajoute :

**Espacements selon le sens** : `TB { spacingHorizontal: 18, spacingVertical: 46 }`, `LR { 80, 5 }`.

**Mode pas à pas** (actif à l'ouverture) : les nœuds de profondeur ≥ 2 sont masqués par un rectangle hachuré (`<pattern id="mm-hachures">` inséré dans le SVG). Le texte reste dans le DOM en `visibility: hidden` pour conserver la mise en page, mais **n'apparaît pas dans le PDF imprimé**. Révélation : clic sur un nœud caché, ou `→` / espace (prochain nœud dans l'ordre de lecture, en dépliant sa branche si besoin). `←` recache le dernier révélé. Un clic sur un nœud révélé le recache (sauf sur un lien).

**Barre d'outils** (fixée en bas, `nav.mm-barre`) :

| Bouton | Action |
|---|---|
| Horizontal / Vertical | Bascule `direction` à chaud avec les espacements associés, puis `fit()`. |
| Tout déplier / Tout replier | Lit l'état réel des nœuds. Replier ramène au niveau `initialExpandLevel`. |
| Pas à pas | Active/désactive le mode (état `aria-pressed`). |
| Tout cacher / Tout révéler | Hors mode pas à pas, « Tout cacher » y entre ; dedans, alterne. |
| − / + | Zoom ×1,25 (aussi au clavier `-`, `+`, `=`). |
| Ajuster | `mm.fit()`. |
| Imprimer | `window.print()`. Pas à pas + Imprimer = fiche à compléter. |

**Impression** : sur `beforeprint`, le `transform` du groupe est neutralisé et un `viewBox` calé sur `mm.state.rect` (marge 24 px) est posé sur le SVG : la carte remplit la page quel que soit son format. Restauré sur `afterprint`. La barre est masquée par `@media print`.

**Thème sombre** : classe `markmap-dark` sur `<html>` si `prefers-color-scheme: dark`. Toutes les couleurs sont des variables CSS.

**Paramètres d'URL** (utiles en iframe) :

| Paramètre | Effet |
|---|---|
| `?sens=LR` ou `?sens=TB` | Force l'orientation (prime sur le frontmatter). |
| `?deplier` | Ouvre toute la carte dépliée. |
| `?revele` | Ouvre **sans** pas à pas (tous les nœuds visibles). Pour les élèves. |

Combinables : `carte.html?revele&deplier`.

## 5. Écrire une carte

Syntaxe markmap inchangée. Les options se placent **sous la clé `markmap:`** du frontmatter ; une clé posée à la racine du frontmatter est ignorée par le build. (Jusqu'au 13/09/2026, les 31 cartes portaient un `maxWidth: 600` à la racine, jamais appliqué, ni par l'ancien pipeline ni par celui-ci : ces lignes mortes ont été supprimées.)

```markdown
---
title: La nature
markmap:
  initialExpandLevel: 2   # défaut : 2 (racine + branches)
  direction: LR           # défaut : TB ; LR pour garder l'horizontal
  maxWidth: 600           # option markmap standard
---
# Racine
- Branche 1 <!--fold-->
  - Feuille <br> retour à la ligne possible
  - Feuille
- Branche 2
  - Feuille
```

`<!--fold-->` en fin de ligne replie le nœud à l'ouverture (fonction markmap standard). Modèle : `cartes/0-modèle.md`.

## 6. Régénérer les cartes du dépôt `schemas`

```bash
cd ~/Github/schemas/outils/markmap-vertical
npm install        # une seule fois (node_modules/ est gitignoré)
npm run cartes     # = node patch.mjs && node build-all.mjs ../../cartes
```

Règles de `build-all.mjs` :

- un `.html` est régénéré depuis le `.md` de même nom, **accents ignorés** (`liberté-leibniz.md` → `liberte-leibniz.html`) ;
- correspondance explicite : `determinisme-ics.html` ← `determinismes-ics.md` (table `CORRESPONDANCES_EXPLICITES`) ;
- un `.md` sans `.html` **n'est pas généré** (choix du 12/09 : les brouillons restent privés). Pour publier une nouvelle carte, générer une fois à la main :

```bash
node build.mjs ../../cartes/ma-carte.md ../../cartes ma-carte
```

- un `.html` sans `.md` est laissé tel quel (`carte1.html`).

Le build copie aussi `cartes/lib/` (d3.min.js, moteur patché, extras). Puis `git add`, `git commit`, `git push` → GitHub Pages `rollauda.github.io/schemas` → redirection vers `www.profauda.fr/schemas`, en ligne en une dizaine de secondes.

Archive des anciens `.html` horizontaux : `5 ARCHIVES/schemas-cartes-html-avant-vertical-2026-09-12.zip`.

## 7. Reproduire ailleurs

### 7.1 Prérequis

- Node.js ≥ 18 (construit avec Node 26.0.0, npm 11.12.1). Aucune autre dépendance système.
- Un navigateur récent (le CSS utilise `color-mix()`).

### 7.2 Le kit portable

Copier ces fichiers **uniquement** (tout le reste est généré ou installé) :

```
markmap-vertical/
├── package.json
├── package-lock.json
├── .gitignore               (node_modules/)
├── patch.mjs
├── build.mjs
├── build-all.mjs
└── lib/
    ├── markmap-extras.js
    └── markmap-extras.css
```

Source de référence : `~/Github/schemas/outils/markmap-vertical/` ou `https://github.com/rollauda/schemas/tree/main/outils/markmap-vertical`.

Ne pas copier `lib/markmap-view-vertical.js` (régénéré par le patch) ni `node_modules/`.

### 7.3 Installation et premier build

```bash
cd markmap-vertical
npm install            # installe d3, markmap-lib, markmap-view aux versions épinglées
npm run patch          # → lib/markmap-view-vertical.js (doit afficher « 21 remplacements »)
mkdir -p ../cartes
cp /chemin/vers/ma-carte.md ../cartes/
node build.mjs ../cartes/ma-carte.md ../cartes
```

Ouvrir `../cartes/ma-carte.html` dans un navigateur : la carte est verticale, en pas à pas, avec la barre d'outils. Le dossier `cartes/` est autonome (html + `lib/`) et peut être déposé tel quel sur n'importe quel hébergement statique.

**Vérifier, ne pas croire le message** : le contrôle fiable est la largeur de la carte rendue (`mm.state.rect` dans la console : `x2 - x1`), pas le « 21 remplacements » qui ne prouve que l'écriture du fichier.

### 7.4 Utiliser le moteur sans les scripts de build

Pour une page HTML écrite à la main (site Docusaurus, page isolée), il suffit des quatre fichiers de `lib/` et d'un arbre JSON produit par `markmap-lib` :

```html
<link rel="stylesheet" href="lib/markmap-extras.css">
<svg id="mindmap"></svg>
<script src="lib/d3.min.js"></script>
<script src="lib/markmap-view-vertical.js"></script>
<script src="lib/markmap-extras.js"></script>
<script>
  markmapExtras.demarrer(document.getElementById('mindmap'), ARBRE_JSON, { direction: 'TB', initialExpandLevel: 2 });
</script>
```

`ARBRE_JSON` est `root` renvoyé par `new Transformer().transform(markdown)` de `markmap-lib` (voir `build.mjs`, qui échappe `<` en `<` avant d'embarquer le JSON dans la page).

### 7.5 Intégrer dans un site (iframe)

```html
<iframe src="https://www.profauda.fr/schemas/cartes/nature.html?revele"
        width="100%" height="600" loading="lazy" style="border:0"></iframe>
```

`?revele` pour une carte de lecture, sans paramètre pour une carte à compléter en classe. Si l'intégration touche les repos Docusaurus (`~/Github/docusaurus/`), prévenir la session Claude des repos avant d'agir (règle du `CLAUDE.md` racine).

### 7.6 Monter de version markmap

1. Changer la version de `markmap-lib` et `markmap-view` dans `package.json` (garder les deux identiques), puis `npm install`.
2. `npm run patch`. Deux issues :
   - **succès** (« 21 remplacements ») : rebuild, contrôler visuellement une carte large et une carte avec feuilles empilées ;
   - **échec** `[nom] 0 occurrence(s) au lieu de 1` : ouvrir `node_modules/markmap-view/dist/browser/index.js`, retrouver le passage correspondant (le tableau du §3 dit ce que chaque remplacement cherche), adapter l'ancre `avant` dans `patch.mjs`, relancer. Un résultat `2 occurrence(s)` signifie que l'ancre est devenue ambiguë : l'allonger.
3. Mettre à jour `VERSION` dans `patch.mjs` (elle n'est que dans le commentaire d'en-tête du fichier généré).

### 7.7 Tester un rendu sans ouvrir la fenêtre

Chrome headless avec `--screenshot` et `--virtual-time-budget` rend une **page blanche** (les transitions d3 n'aboutissent pas). Utiliser `puppeteer-core` pointé sur le Chrome installé, en temps réel :

```js
import puppeteer from 'puppeteer-core';
const navigateur = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const page = await navigateur.newPage();
await page.goto('file:///…/cartes/nature.html?revele&deplier');
await new Promise((r) => setTimeout(r, 1500));
const largeur = await page.evaluate(() => mm.state.rect.x2 - mm.state.rect.x1);
await page.screenshot({ path: 'nature.png', fullPage: true });
console.log(largeur);
await navigateur.close();
```

(`window.mm` est exposé par la surcouche précisément pour ce genre de contrôle.)

## 8. Limites connues et pistes

- `sciences` (2 423 px) et `origines-langage` restent plus larges que l'écran à l'ouverture dépliée ; `direction: LR` reste possible carte par carte.
- Les fonctions markmap non embarquées (KaTeX, Prism) sont signalées par un avertissement au build et non prises en charge.
- Le mode pas à pas est perdu au rechargement : pas de mémoire de l'état révélé.
- `PROFONDEUR_TROUS = 2` et les constantes de pile sont codées en dur dans les sources ; les changer demande un rebuild.

## 9. Historique

Commits du dépôt `schemas`, 12 septembre 2026 :

| SHA | Objet |
|---|---|
| `cf75561` | Cartes en vertical : moteur markmap modifié, servi en local |
| `0eeadad` | Vertical : feuilles empilées en colonne sous leur parent |
| `55bab70` | Cartes pliées à l'ouverture ; bouton déplier/replier fidèle à l'état |
| `f74ff60` | À trous par défaut, un seul mode, Tout révéler/cacher, zoom − + |
| `2fdf79f` | « Pas à pas » remplace « À trous » ; « Tout cacher » toujours disponible |

24 cartes régénérées et publiées. Notes de session : mémoire Claude `project_session_2026_09_12_markmap_vertical.md`.
