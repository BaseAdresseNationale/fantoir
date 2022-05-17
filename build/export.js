const {remove} = require('fs-extra')
const bluebird = require('bluebird')
const Keyv = require('keyv')

async function exportAsKeyValueStore(model, destPath) {
  await remove(destPath)
  const keyv = new Keyv('sqlite://' + destPath)

  await bluebird.each(model.getCommunes(), async commune => {
    const voies = model.getVoies(commune.codeCommune)
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

    await keyv.set(commune.codeCommune, voies)
  })
}

module.exports = {exportAsKeyValueStore}
