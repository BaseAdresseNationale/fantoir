const chalk = require('chalk')
const {chain} = require('lodash')
const {getCommuneActuelle} = require('../lib/cog')
const {matchVoies} = require('./match')

function handleCancelledCommunes(model) {
  chain(model.getCancelledCommunes())
    .map(communeAncienne => {
      const communeActuelle = getCommuneActuelle(communeAncienne)
      if (!communeActuelle) {
        console.log(chalk.yellow(`Commune annulée sans successeur : ${communeAncienne}`))
        return null
      }

      if (!model.hasCommune(communeActuelle.code)) {
        console.log(chalk.red(`Commune actuelle non présente dans le fichier : ${communeActuelle.code}`))
        return null
      }

      return {communeAncienne, communeActuelle: communeActuelle.code}
    })
    .compact()
    .groupBy('communeActuelle')
    .forEach((records, communeActuelle) => {
      const voiesCommuneActuelle = model.getVoies(communeActuelle)
        .filter(v => v.predecesseur === undefined)
      const anciennesVoies = chain(records)
        .map(c => model.getVoies(c.communeAncienne))
        .flatten()
        .filter(v => v.successeur === undefined && v.annulationCommune && v.transferee)
        .value()

      matchVoies(anciennesVoies, voiesCommuneActuelle)
    })
    .value()
}

module.exports = {handleCancelledCommunes}
