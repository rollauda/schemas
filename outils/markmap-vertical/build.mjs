// Usage : node build.mjs <carte.md> [dossier-sortie] [nom-de-sortie]
// Produit <dossier>/<nom>.html + <dossier>/lib/ (scripts hébergés localement, aucun CDN).
// Le nom de sortie permet de garder un nom .html sans accent quand le .md en porte.
import { Transformer } from 'markmap-lib';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));

export function construire(source, sortie = 'dist', nom = basename(source, '.md')) {
  const { root, frontmatter, features } = new Transformer().transform(readFileSync(source, 'utf8'));
  if (Object.keys(features).length) {
    console.warn(`  ${basename(source)} : fonctions non embarquées : ${Object.keys(features).join(', ')}`);
  }
  const titre = frontmatter?.title || nom;
  const options = { direction: 'TB', ...frontmatter?.markmap };
  const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre.replace(/</g, '&lt;')}</title>
<link rel="stylesheet" href="lib/markmap-extras.css">
</head>
<body>
<svg id="mindmap"></svg>
<script src="lib/d3.min.js"></script>
<script src="lib/markmap-view-vertical.js"></script>
<script src="lib/markmap-extras.js"></script>
<script>markmapExtras.demarrer(document.getElementById('mindmap'), ${json(root)}, ${json(options)});</script>
</body>
</html>
`;
  const cible = join(sortie, nom + '.html');
  writeFileSync(cible, html);
  return { cible, options };
}

export function copierLib(sortie) {
  mkdirSync(join(sortie, 'lib'), { recursive: true });
  copyFileSync(join(ICI, 'node_modules/d3/dist/d3.min.js'), join(sortie, 'lib/d3.min.js'));
  for (const f of ['markmap-view-vertical.js', 'markmap-extras.js', 'markmap-extras.css']) {
    copyFileSync(join(ICI, 'lib', f), join(sortie, 'lib', f));
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [source, sortie = 'dist', nom] = process.argv.slice(2);
  copierLib(sortie);
  const { cible, options } = construire(source, sortie, nom);
  console.log(`${cible} écrit — options : ${JSON.stringify(options)}`);
}
