# markmap-vertical

Moteur des cartes de `cartes/` : [markmap-view 0.18.12](https://github.com/markmap/markmap) modifié pour dessiner de haut en bas, plus une surcouche pédagogique (schéma à trous, pas à pas, impression). Aucun CDN : tout est servi depuis `cartes/lib/`.

En vertical, les **feuilles** (nœuds sans enfants) d'un même parent s'empilent en colonne, reliées par une ligne en équerre ; les nœuds qui ont des enfants restent côte à côte. Cela divise la largeur des cartes par 2 à 3 (`nature` : 4 391 → 1 421 px).

## Régénérer les cartes

```bash
cd outils/markmap-vertical
npm install        # une seule fois
npm run cartes     # patch markmap-view + régénère chaque cartes/*.html depuis son .md
```

Règles de `build-all.mjs` : un `.html` est régénéré depuis le `.md` de même nom (accents ignorés : `liberté-leibniz.md` → `liberte-leibniz.html`) ; un `.md` sans `.html` n'est pas généré ; un `.html` sans `.md` est laissé tel quel. Pour une seule carte : `node build.mjs ../../cartes/x.md ../../cartes [nom-sans-accent]`.

## Écrire une carte

Même syntaxe que markmap. En tête du `.md`, dans le bloc `markmap:` :

- `initialExpandLevel` — niveaux dépliés à l'ouverture (défaut : 2, la racine et ses branches ; « Tout replier » y ramène) ;
- `direction: LR` — garder la carte à l'horizontale (défaut : `TB`, vertical).

## Dans la page

Boutons : Horizontal/Vertical · Tout déplier/replier · À trous (actif à l'ouverture : les nœuds sont masqués ; clic ou → pour révéler, ← pour recacher) · Tout révéler/cacher · − + (zoom, aussi au clavier) · Ajuster · Imprimer (à trous + imprimer = fiche à compléter, le texte masqué n'est pas dans le PDF).

Paramètres d'URL, utiles en iframe : `?deplier` · `?revele` (ouvre sans trous) · `?sens=LR`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `patch.mjs` | 21 remplacements contrôlés dans le bundle officiel → `lib/markmap-view-vertical.js` (généré, ne pas éditer). S'arrête en erreur si markmap a changé. |
| `lib/markmap-extras.js` / `.css` | trous, pas à pas, impression, barre d'outils, thème sombre, cadres des nœuds |
| `build.mjs` | `.md` → `.html` (embarque l'arbre JSON, copie `lib/`) |
| `build-all.mjs` | boucle sur `cartes/` |

Mettre à jour markmap : changer la version dans `package.json`, `npm install`, `npm run patch` — si un remplacement échoue, adapter `patch.mjs` en lisant `node_modules/markmap-view/dist/browser/index.js`.
