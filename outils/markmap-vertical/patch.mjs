// Produit lib/markmap-view-vertical.js à partir du bundle navigateur officiel de markmap-view.
// Ajoute l'option `direction` : "LR" (horizontal, comportement d'origine) ou "TB" (vertical, haut → bas).
// Chaque remplacement doit trouver exactement une occurrence : si markmap change, le script échoue
// au lieu de produire un fichier à moitié modifié.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const VERSION = '0.18.12';
const SOURCE = "node_modules/markmap-view/dist/browser/index.js";
const CIBLE = 'lib/markmap-view-vertical.js';

let code = readFileSync(SOURCE, 'utf8');

function remplacer(nom, avant, apres) {
  const n = code.split(avant).length - 1;
  if (n !== 1) throw new Error(`[${nom}] ${n} occurrence(s) au lieu de 1`);
  code = code.replace(avant, () => apres);
}

// 1. Option par défaut + passage depuis le frontmatter (deriveOptions)
remplacer('options-defaut',
  `    spacingVertical: 5\n  };`,
  `    spacingVertical: 5,\n    direction: "LR"\n  };`);
remplacer('derive-options',
  `    const booleanKeys = ["zoom", "pan"];`,
  `    if (options.direction === "TB" || options.direction === "LR") derivedOptions.direction = options.direction;\n    const booleanKeys = ["zoom", "pan"];`);

// 2. Deux formes de lien
remplacer('forme-lien',
  `  const linkShape = d32.linkHorizontal();`,
  `  const linkShapeH = d32.linkHorizontal();\n  const linkShapeV = d32.linkVertical();`);

// 3. Mise en page : en TB, flextree travaille dans son sens naturel (x = largeur, y = profondeur)
remplacer('layout-debut',
  `      const { lineWidth, paddingX, spacingHorizontal, spacingVertical } = this.options;\n      const layout = flextree({})`,
  `      const { lineWidth, paddingX, spacingHorizontal, spacingVertical } = this.options;\n      const isTB = this.options.direction === "TB";\n      const layout = flextree({})`);
remplacer('layout-taille',
  `        const [width, height] = node.data.state.size;\n        return [height,`,
  `        const [width, height] = node.data.state.size;\n        if (isTB) return [width + (width ? paddingX * 2 : 0), height + spacingVertical];\n        return [height,`);
remplacer('layout-espacement',
  `      }).spacing((a, b) => {\n        return (a.parent`,
  `      }).spacing((a, b) => {\n        if (isTB) return a.parent === b.parent ? spacingHorizontal : spacingHorizontal * 2;\n        return (a.parent`);
remplacer('layout-rect',
  `        node.state.rect = {\n          x: fnode.y,\n          y: fnode.x - fnode.xSize / 2,\n          width: fnode.ySize - spacingHorizontal,\n          height: fnode.xSize\n        };`,
  `        node.state.rect = isTB ? {\n          x: fnode.x - fnode.xSize / 2,\n          y: fnode.y,\n          width: fnode.xSize,\n          height: fnode.ySize - spacingVertical\n        } : {\n          x: fnode.y,\n          y: fnode.x - fnode.xSize / 2,\n          width: fnode.ySize - spacingHorizontal,\n          height: fnode.xSize\n        };`);

// 4. Rendu : points d'attache des liens, animations d'entrée/sortie, souligné, cercle de pliage
remplacer('rendu-debut',
  `      const { paddingX, autoFit, color, maxWidth, lineWidth } = this.options;`,
  `      const { paddingX, autoFit, color, maxWidth, lineWidth } = this.options;\n      const isTB = this.options.direction === "TB";\n      const linkShape = isTB ? linkShapeV : linkShapeH;\n      this.svg.classed("markmap-tb", isTB);`);
remplacer('lien-entree',
  `          originRect.x + originRect.width,\n          originRect.y + originRect.height\n`,
  `          isTB ? originRect.x + originRect.width / 2 : originRect.x + originRect.width,\n          originRect.y + originRect.height\n`);
remplacer('noeud-entree',
  `translate(\${originRect.x + originRect.width - d.state.rect.width},`,
  `translate(\${isTB ? originRect.x + originRect.width / 2 - d.state.rect.width / 2 : originRect.x + originRect.width - d.state.rect.width},`);
remplacer('noeud-sortie',
  `        const targetX = targetRect.x + targetRect.width - d.state.rect.width;`,
  `        const targetX = isTB ? targetRect.x + targetRect.width / 2 - d.state.rect.width / 2 : targetRect.x + targetRect.width - d.state.rect.width;`);
remplacer('souligne',
  `.attr("stroke", (d) => color(d)).attr("stroke-width", lineWidth);`,
  `.attr("stroke", (d) => color(d)).attr("stroke-width", isTB ? 0 : lineWidth);`);
remplacer('cercle',
  `mmCircleMerge.attr("cx", (d) => d.state.rect.width)`,
  `mmCircleMerge.attr("cx", (d) => isTB ? d.state.rect.width / 2 : d.state.rect.width)`);
remplacer('lien-sortie',
  `          targetRect.x + targetRect.width,\n          targetRect.y + targetRect.height + lineWidth(d.target) / 2`,
  `          isTB ? targetRect.x + targetRect.width / 2 : targetRect.x + targetRect.width,\n          targetRect.y + targetRect.height + lineWidth(d.target) / 2`);
remplacer('lien-trace',
  `        const source = [\n          origSource.state.rect.x + origSource.state.rect.width,\n          origSource.state.rect.y + origSource.state.rect.height + lineWidth(origSource) / 2\n        ];\n        const target = [\n          origTarget.state.rect.x,\n          origTarget.state.rect.y + origTarget.state.rect.height + lineWidth(origTarget) / 2\n        ];`,
  `        const source = isTB ? [\n          origSource.state.rect.x + origSource.state.rect.width / 2,\n          origSource.state.rect.y + origSource.state.rect.height + lineWidth(origSource) / 2\n        ] : [\n          origSource.state.rect.x + origSource.state.rect.width,\n          origSource.state.rect.y + origSource.state.rect.height + lineWidth(origSource) / 2\n        ];\n        const target = isTB ? [\n          origTarget.state.rect.x + origTarget.state.rect.width / 2,\n          origTarget.state.rect.y\n        ] : [\n          origTarget.state.rect.x,\n          origTarget.state.rect.y + origTarget.state.rect.height + lineWidth(origTarget) / 2\n        ];`);

// 5. Feuilles empilées (TB) : les enfants sans descendance d'un même parent forment une colonne,
//    représentée dans flextree par un nœud synthétique `__pile` ; les branches restent côte à côte.
remplacer('pile-constantes',
  `      const isTB = this.options.direction === "TB";\n      const layout = flextree({})`,
  `      const isTB = this.options.direction === "TB";\n      const PILE_RETRAIT = 22, PILE_ECART = 8;\n      const largeurNoeud = (n) => n.state.size[0] + (n.state.size[0] ? paddingX * 2 : 0);\n      const layout = flextree({})`);
remplacer('pile-enfants',
  `        if (!((_a = d.payload) == null ? void 0 : _a.fold)) return d.children;\n      }).nodeSize((node) => {\n        const [width, height] = node.data.state.size;\n        if (isTB) return [`,
  `        if ((_a = d.payload) == null ? void 0 : _a.fold) return;\n        if (!isTB || !d.children || d.__pile) return d.children;\n        const feuilles = d.children.filter((k) => !(k.children && k.children.length));\n        if (feuilles.length < 2) return d.children;\n        const branches = d.children.filter((k) => k.children && k.children.length);\n        const position = d.children.slice(0, d.children.indexOf(feuilles[0])).filter((k) => k.children && k.children.length).length;\n        branches.splice(position, 0, { __pile: true, feuilles, state: { rect: { x: 0, y: 0, width: 0, height: 0 } } });\n        return branches;\n      }).nodeSize((node) => {\n        if (node.data.__pile) {\n          const { feuilles } = node.data;\n          const largeur = Math.max(...feuilles.map(largeurNoeud)) + PILE_RETRAIT;\n          const hauteur = feuilles.reduce((s, f) => s + f.state.size[1], 0) + PILE_ECART * (feuilles.length - 1);\n          return [largeur, hauteur + spacingVertical];\n        }\n        const [width, height] = node.data.state.size;\n        if (isTB) return [`);
remplacer('pile-rects',
  `        const node = fnode.data;\n        node.state.rect = isTB ? {`,
  `        const node = fnode.data;\n        if (node.__pile) {\n          const x = fnode.x - fnode.xSize / 2;\n          let y = fnode.y;\n          node.state.rect = { x, y, width: fnode.xSize, height: fnode.ySize - spacingVertical };\n          node.feuilles.forEach((f) => {\n            f.state.rect = { x: x + PILE_RETRAIT, y, width: largeurNoeud(f), height: f.state.size[1] };\n            f.state.empile = { x: x + PILE_RETRAIT / 2, y: fnode.y };\n            y += f.state.size[1] + PILE_ECART;\n          });\n          return;\n        }\n        node.state.empile = null;\n        node.state.rect = isTB ? {`);
remplacer('pile-lien',
  `        const origSource = d.source;\n        const origTarget = d.target;\n        const source = isTB ? [`,
  `        const origSource = d.source;\n        const origTarget = d.target;\n        if (isTB && origTarget.state.empile) {\n          const sx = origSource.state.rect.x + origSource.state.rect.width / 2;\n          const sy = origSource.state.rect.y + origSource.state.rect.height + lineWidth(origSource) / 2;\n          const { x: px, y: py } = origTarget.state.empile;\n          const my = (sy + py) / 2;\n          const r = origTarget.state.rect;\n          return \`M\${sx},\${sy}C\${sx},\${my},\${px},\${my},\${px},\${py}V\${r.y + r.height / 2}H\${r.x + paddingX}\`;\n        }\n        const source = isTB ? [`);
remplacer('pile-couleur',
  `this.transition(mmPathMerge).attr("stroke", (d) => color(d.target))`,
  `this.transition(mmPathMerge).attr("stroke", (d) => isTB && d.target.state.empile ? color(d.source) : color(d.target))`);

mkdirSync('lib', { recursive: true });
writeFileSync(CIBLE,
  `/* markmap-view ${VERSION} modifié (option direction "TB") — GÉNÉRÉ par patch.mjs, ne pas éditer. */\n` + code);
console.log(`${CIBLE} écrit (21 remplacements).`);
