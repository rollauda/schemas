// Usage : node build-all.mjs <dossier cartes>
// Régénère chaque .html existant depuis son .md (même nom, ou même nom sans accents).
// Les .md sans .html ne sont pas générés ; les .html sans .md sont laissés tels quels.
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { construire, copierLib } from './build.mjs';

const CORRESPONDANCES_EXPLICITES = { 'determinisme-ics': 'determinismes-ics' };
const sansAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

const dossier = process.argv[2];
const fichiers = readdirSync(dossier);
const mds = fichiers.filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
const htmls = fichiers.filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));

copierLib(dossier);
const faits = [];
const sansSource = [];
for (const nom of htmls) {
  const source =
    (existsSync(join(dossier, nom + '.md')) && nom) ||
    mds.find((m) => sansAccents(m) === nom) ||
    (CORRESPONDANCES_EXPLICITES[nom] && mds.find((m) => m === CORRESPONDANCES_EXPLICITES[nom]));
  if (!source) {
    sansSource.push(nom + '.html');
    continue;
  }
  const { options } = construire(join(dossier, source + '.md'), dossier, nom);
  faits.push(`${nom}.html ← ${source}.md${options.direction !== 'TB' ? ' (' + options.direction + ')' : ''}`);
}
console.log(`${faits.length} cartes régénérées :\n  ` + faits.join('\n  '));
if (sansSource.length) console.log(`Laissés tels quels (pas de .md) : ${sansSource.join(', ')}`);
