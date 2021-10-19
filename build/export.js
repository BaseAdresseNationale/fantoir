const {chain} = require('lodash')
const {remove} = require('fs-extra')
const bluebird = require('bluebird')
const Keyv = require('keyv')
const {getCommunes, getCodesMembres} = require('./cog')

async function exportAsKeyValueStore(model, destPath) {
  await remove(destPath)
  const keyv = new Keyv('sqlite://' + destPath)

  await bluebird.each(getCommunes(), async commune => {
    const codesCommunesAssocies = getCodesMembres(commune)
    const voies = chain(codesCommunesAssocies)
      .map(codeCommuneAssocie => {
        return model.getVoies(codeCommuneAssocie)
          .map(voie => {
            const flattenedVoie = {...voie}

            if (voie.successeur) {
              flattenedVoie.successeur = voie.successeur.id
            }

            if (voie.predecesseur) {
              flattenedVoie.predecesseur = voie.predecesseur.id
            }

            return flattenedVoie
          })
      })
      .flatten()
      .compact()
      .value()

    if (voies.length > 0) {
      await keyv.set(commune.code, voies)
    }
  })
}

module.exports = {exportAsKeyValueStore}
