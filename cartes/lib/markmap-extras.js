/* Surcouche pédagogique pour markmap-view-vertical : orientation, schéma à trous, pas à pas, impression.
   Paramètres d'URL (utiles pour les iframes) : ?sens=TB|LR · ?deplier · ?trous */
(function () {
  const ESPACEMENTS = {
    TB: { spacingHorizontal: 18, spacingVertical: 46 },
    LR: { spacingHorizontal: 80, spacingVertical: 5 },
  };
  const PROFONDEUR_TROUS = 2; // la racine (profondeur 1) reste toujours visible

  function parcourir(noeud, fn, parent) {
    fn(noeud, parent);
    (noeud.children || []).forEach((enfant) => parcourir(enfant, fn, noeud));
  }

  async function demarrer(svg, racine, optionsJSON) {
    const params = new URLSearchParams(location.search);
    const sens = ['TB', 'LR'].includes(params.get('sens')) ? params.get('sens') : optionsJSON.direction || 'TB';
    if (matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('markmap-dark');

    const mm = markmap.Markmap.create(svg, markmap.deriveOptions({ ...ESPACEMENTS[sens], ...optionsJSON, direction: sens }));
    window.mm = mm;
    const etat = { trous: params.has('trous'), pasAPas: false, reveles: new Set(), pile: [] };

    // Motif hachuré des trous (SVG : imprimé tel quel, et le texte masqué n'est plus dans le PDF)
    mm.svg.insert('defs', ':first-child').html(
      '<pattern id="mm-hachures" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="10" height="10" class="mm-hachure-fond"/><rect width="4" height="10" class="mm-hachure-trait"/></pattern>');

    function appliquer() {
      const { paddingX } = mm.options;
      mm.g.selectAll('g.markmap-node').each(function (d) {
        this.style.setProperty('--c', mm.options.color(d));
        const masque = etat.trous && d.state.depth >= PROFONDEUR_TROUS && !etat.reveles.has(d.state.path);
        this.toggleAttribute('data-masque', masque);
        let trou = d3.select(this).select(':scope > rect.mm-trou');
        if (trou.empty()) trou = d3.select(this).insert('rect', 'foreignObject').attr('class', 'mm-trou');
        trou
          .attr('x', paddingX)
          .attr('width', Math.max(0, d.state.rect.width - paddingX * 2))
          .attr('height', d.state.rect.height)
          .attr('rx', mm.options.direction === 'TB' ? 9 : 3);
      });
      majBarre();
    }

    // Chaque rendu recrée des nœuds : on réapplique couleurs et masques juste après la création, puis à la fin.
    const renderData = mm.renderData.bind(mm);
    mm.renderData = async (origine) => {
      const rendu = renderData(origine);
      appliquer();
      await rendu;
      appliquer();
    };

    function replier(fold) {
      parcourir(mm.state.data, (n) => {
        if (n.children?.length && (fold === 0 || n.state.depth >= PROFONDEUR_TROUS)) n.payload = { ...n.payload, fold };
      });
      return mm.renderData();
    }

    async function suivant() {
      const liste = [];
      const parents = new Map();
      parcourir(mm.state.data, (n, p) => {
        if (p) parents.set(n, p);
        if (n.state.depth >= PROFONDEUR_TROUS) liste.push(n);
      });
      const n = liste.find((x) => !etat.reveles.has(x.state.path));
      if (!n) return;
      etat.reveles.add(n.state.path);
      etat.pile.push(n.state.path);
      let deplie = false;
      for (let a = parents.get(n); a; a = parents.get(a)) {
        if (a.payload?.fold) {
          a.payload = { ...a.payload, fold: 0 };
          deplie = true;
        }
      }
      if (deplie) {
        await mm.renderData(parents.get(n));
        mm.fit();
      } else {
        appliquer();
        mm.ensureVisible(n, { left: 40, right: 40, top: 40, bottom: 90 });
      }
    }

    function precedent() {
      const chemin = etat.pile.pop();
      if (!chemin) return;
      etat.reveles.delete(chemin);
      appliquer();
    }

    // Barre d'outils
    const barre = document.createElement('nav');
    barre.className = 'mm-barre';
    barre.setAttribute('aria-label', 'Outils de la carte');
    const boutons = {};
    function bouton(cle, action) {
      const b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', action);
      barre.append(b);
      boutons[cle] = b;
    }
    bouton('sens', async () => {
      const nouveau = mm.options.direction === 'TB' ? 'LR' : 'TB';
      mm.setOptions({ direction: nouveau, ...ESPACEMENTS[nouveau] });
      await mm.renderData();
      mm.fit();
    });
    bouton('deplier', async () => {
      const toutDeplie = boutons.deplier.dataset.deplie === '1';
      await replier(toutDeplie ? 1 : 0);
      boutons.deplier.dataset.deplie = toutDeplie ? '0' : '1';
      mm.fit();
    });
    bouton('trous', () => {
      etat.trous = !etat.trous;
      etat.pasAPas = false;
      etat.reveles.clear();
      etat.pile = [];
      appliquer();
    });
    bouton('pas', () => {
      etat.pasAPas = !etat.pasAPas;
      etat.trous = etat.pasAPas || etat.trous;
      etat.reveles.clear();
      etat.pile = [];
      appliquer();
    });
    bouton('reveler', () => {
      parcourir(mm.state.data, (n) => etat.reveles.add(n.state.path));
      etat.pasAPas = false;
      appliquer();
    });
    bouton('ajuster', () => mm.fit());
    bouton('imprimer', () => window.print());
    const aide = document.createElement('span');
    aide.className = 'mm-aide';
    barre.append(aide);
    document.body.append(barre);

    function majBarre() {
      boutons.sens.textContent = mm.options.direction === 'TB' ? 'Horizontal' : 'Vertical';
      boutons.deplier.textContent = boutons.deplier.dataset.deplie === '1' ? 'Tout replier' : 'Tout déplier';
      boutons.trous.textContent = 'À trous';
      boutons.trous.setAttribute('aria-pressed', etat.trous);
      boutons.pas.textContent = 'Pas à pas';
      boutons.pas.setAttribute('aria-pressed', etat.pasAPas);
      boutons.reveler.textContent = 'Tout révéler';
      boutons.reveler.hidden = !etat.trous;
      boutons.ajuster.textContent = 'Ajuster';
      boutons.imprimer.textContent = 'Imprimer';
      aide.textContent = etat.pasAPas ? `→ suivant · ← retour (${etat.pile.length})` : etat.trous ? 'Cliquer un trou pour le révéler' : '';
    }

    // Clic sur un nœud en mode à trous : révèle, ou remasque un nœud déjà révélé (les liens restent cliquables).
    svg.addEventListener('click', (e) => {
      if (!etat.trous || e.target.closest('circle')) return;
      const g = e.target.closest('g.markmap-node');
      if (!g) return;
      const d = d3.select(g).datum();
      if (d.state.depth < PROFONDEUR_TROUS) return;
      if (g.hasAttribute('data-masque')) {
        etat.reveles.add(d.state.path);
      } else if (e.target.closest('a')) {
        return;
      } else {
        etat.reveles.delete(d.state.path);
      }
      appliquer();
    });

    document.addEventListener('keydown', (e) => {
      if (!etat.pasAPas) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        suivant();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        precedent();
      }
    });

    // Impression : un viewBox calé sur la carte l'ajuste à la page, quel que soit son format.
    window.addEventListener('beforeprint', () => {
      const { x1, y1, x2, y2 } = mm.state.rect;
      const marge = 24;
      mm.g.attr('data-transform', mm.g.attr('transform')).attr('transform', null);
      svg.setAttribute('viewBox', `${x1 - marge} ${y1 - marge} ${x2 - x1 + 2 * marge} ${y2 - y1 + 2 * marge}`);
    });
    window.addEventListener('afterprint', () => {
      svg.removeAttribute('viewBox');
      mm.g.attr('transform', mm.g.attr('data-transform'));
    });

    await mm.setData(racine);
    if (params.has('deplier')) {
      boutons.deplier.dataset.deplie = '1';
      await replier(0);
    }
    await mm.fit();
  }

  window.markmapExtras = { demarrer };
})();
