# @etalab/fantoir [![npm version](https://img.shields.io/npm/v/@etalab/fantoir.svg)](https://www.npmjs.com/package/@etalab/fantoir) [![CircleCI](https://circleci.com/gh/etalab/fantoir.svg?style=svg)](https://circleci.com/gh/etalab/fantoir)

Boîte à outils JavaScript permettant de manipuler facilement les données [FANTOIR](https://www.data.gouv.fr/fr/datasets/fichier-fantoir-des-voies-et-lieux-dits/).

## Pré-requis

Cette bibliothèque nécessite [Node.js](https://nodejs.org) version 8 ou supérieure.

Une adaptation est possible pour le navigateur. Toute _pull request_ en ce sens sera la bienvenue.

## Installation

```bash
npm install @etalab/fantoir
# ou
yarn add @etalab/fantoir
```

## Utilisation

Pour utiliser un fichier FANTOIR départemental :

```js
const {createDatabase} = require('@etalab/fantoir')

const fantoir = await createDatabase('/chemin/vers/fichier/fantoir')

// Accéder à une voie en particulier
fantoir.get('12345-1234') // => Record

fantoir.size // => Nombre de d'enregistrements
fantoir.records // => Retourne tous les enregistrements sous forme de tableau

// On peut travailler sur une extraction communale, qui est cherchable par défaut
const commune = fantoir.commune('12345')
commune.search('République') // => [Results]

// On peut travailler sur une extraction personnalisée
const subset = fantoir.subset(r => r.code_commune === '12345', {searchable: true})
```

## Licence

MIT
