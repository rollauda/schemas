---
title: markmap
layout: default
nav_order: 35
published: true
---
## sans le plugin vscodium
Pour intégrer une carte mentale dynamique dans un site statique Jekyll avec le thème Just the Docs, vous pouvez utiliser la bibliothèque Markmap. Voici les étapes à suivre :

1. Installez Markmap en utilisant la commande suivante dans le terminal :

```
npm install markmap-cli
```

2. Créez une carte mentale en utilisant un éditeur de texte. Par exemple, créez un fichier `mindmap.md`.

3. Dans votre fichier Markdown, créez une liste imbriquée pour représenter la structure de votre carte mentale. Par exemple :

```markdown
- Racine
  - Noeud 1
    - Sous-noeud 1
    - Sous-noeud 2
  - Noeud 2
    - Sous-noeud 3
    - Sous-noeud 4
```

4. Enregistrez le fichier `mindmap.md`.

5. Générez la carte mentale en utilisant la commande suivante dans le terminal :

```
markmap mindmap.md
```

Cela créera un fichier HTML pour votre carte mentale.

6. Dans votre page Markdown Jekyll, intégrez votre carte mentale en utilisant la balise `<iframe>` suivante :

```html
<iframe src="/path/to/mindmap.html" width="100%" height="600px" frameborder="0"></iframe>
```

Assurez-vous de remplacer `/path/to/mindmap.html` par le chemin d'accès réel à votre fichier HTML de carte mentale.

7. Construisez et visualisez votre site Jekyll pour voir votre carte mentale intégrée.

Il est important de noter que si vous utilisez le thème Just the Docs, vous pouvez intégrer votre carte mentale dans une page en créant un fichier Markdown pour la page et en incluant le code HTML ci-dessus.``

## avec le plugin
L'extension Markmap pour Visual Studio Code permet d'afficher des cartes mentales dynamiques directement dans l'éditeur de code. Elle utilise la bibliothèque Markmap pour générer des cartes mentales à partir de code Markdown.

Pour installer l'extension Markmap dans Visual Studio Code, vous pouvez suivre les étapes suivantes :

1. Ouvrez Visual Studio Code.
2. Allez dans le menu Extensions en cliquant sur l'icône en forme de carré dans la barre latérale de gauche, ou en appuyant sur `Ctrl+Shift+X` sur Windows ou `Cmd+Shift+X` sur Mac.
3. Dans la barre de recherche, tapez "markmap" et appuyez sur Entrée.
4. Cliquez sur le bouton "Install" à côté de l'extension Markmap.
5. Une fois l'installation terminée, redémarrez Visual Studio Code.

Pour utiliser l'extension Markmap dans une page Markdown d'un site statique Jekyll, vous pouvez simplement ajouter la syntaxe Markdown suivante :

```markmap
# Racine
- Fils 1
  - Petit-fils 1
  - Petit-fils 2
- Fils 2
  - Petit-fils 3
  - Petit-fils 4
```


Dans cet exemple, une carte mentale avec une racine et des nœuds fils est créée à l'aide de la syntaxe Markdown Markmap. Lorsque vous affichez la page dans votre navigateur, l'extension Markmap affichera la carte mentale dynamique correspondante.

Il est important de noter que pour que l'extension Markmap fonctionne correctement, vous devez également inclure la bibliothèque Markmap dans votre projet Jekyll, comme expliqué dans les réponses précédentes.

---

Pour exporter une carte mentale Markmap en HTML avec l'extension Markmap pour VSCode, vous pouvez suivre les étapes suivantes :

Ouvrez votre fichier Markdown contenant la carte mentale Markmap dans VSCode.

Dans la barre latérale de gauche de VSCode, cliquez sur l'icône "Markmap" pour ouvrir le panneau Markmap.

Cliquez sur le bouton "Export" dans le coin supérieur droit du panneau Markmap.

Choisissez l'option "Export HTML" dans le menu déroulant.

Choisissez un emplacement pour enregistrer le fichier HTML exporté et donnez-lui un nom approprié.

Cliquez sur "Enregistrer" pour exporter la carte mentale Markmap en HTML.

Vous pouvez ensuite ouvrir le fichier HTML exporté dans votre navigateur pour afficher la carte mentale.

---

Pour insérer une carte mentale Markmap HTML dans une page de votre site Jekyll, suivez les étapes suivantes :

1. Générez votre carte mentale Markmap à l'aide de l'extension Markmap pour Visual Studio Code. Exportez ensuite votre carte mentale en HTML en utilisant la commande "Markmap: Export HTML" dans le menu de commande de Visual Studio Code.

2. Dans votre projet Jekyll, créez un nouveau fichier Markdown pour la page sur laquelle vous souhaitez inclure la carte mentale.

3. Ajoutez une section HTML à votre fichier Markdown et insérez le code HTML généré dans l'étape précédente. Vous pouvez coller le code HTML directement dans votre fichier Markdown ou le stocker dans un fichier HTML séparé et l'inclure à l'aide de la balise `<include>`. 

Par exemple, si vous avez exporté votre carte mentale en HTML dans un fichier nommé "map.html" dans le dossier "assets", vous pouvez inclure la carte mentale dans votre fichier Markdown en utilisant la balise suivante :

<iframe src="../../assets/cartes/carte1.html" width="100%" height="600px" frameborder="0"></iframe>

4. Exécutez Jekyll pour construire votre site. La carte mentale Markmap sera maintenant visible sur la page correspondante de votre site Jekyll.

Il est important de noter que la taille de la carte mentale peut varier en fonction de la quantité de contenu qu'elle contient et de la configuration de votre site Jekyll. Vous devrez peut-être expérimenter avec différents paramètres pour trouver la configuration qui convient le mieux à votre site.