# @etalab/fantoir [![npm version](https://img.shields.io/npm/v/@etalab/fantoir.svg)](https://www.npmjs.com/package/@etalab/fantoir)

Bibliothèque permettant d'interroger facilement la base [FANTOIR](https://www.data.gouv.fr/fr/datasets/fichier-fantoir-des-voies-et-lieux-dits/).

## Pré-requis

Cette bibliothèque nécessite [Node.js](https://nodejs.org) version 10 ou supérieur.

### Installation

```
yarn add @etalab/fantoir
```

### Utilisation

```js
const {createFantoirCommune} = require('@etalab/fantoir')
const fantoirCommune = await createFantoirCommune('54099', options)

// Rechercher une voie
fantoirCommune.findVoie('rue du parc')

// Rechercher une voie en indiquant une commune membre
fantoirCommune.findVoie('rue du parc', '54342')
```

### Production de la base au format SQLite (développement)

```
zcat fantoir-* | yarn build
```

### Configuration

Le chemin vers la base FANTOIR doit être renseigné soit via l’option `fantoirPath` soit via la variable d’environnement `FANTOIR_PATH`.

Les entrées FANTOIR annulées des communes fusionnées sont chargées par défaut. Pour ne charger que le code demandé, il faut renseigner l’option `withAnciennesCommunes: false`.

## Licence

MIT
