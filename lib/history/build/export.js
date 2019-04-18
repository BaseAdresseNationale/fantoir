/* eslint camelcase: off */
const {promisify} = require('util')
const finished = promisify(require('stream').finished)
const {createWriteStream} = require('fs')
const {createGzip} = require('zlib')
const csvWriter = require('csv-write-stream')
const pumpify = require('pumpify')
const {getNomCommune, getCommune} = require('./cog')

function exportAsCsv(model, destPath) {
  const csvStream = pumpify.obj(
    csvWriter(),
    createGzip(),
    createWriteStream(destPath)
  )

  model.getCommunes().forEach(communeEntry => {
    const codeCommune = communeEntry.id
    const commune = getCommune(codeCommune)
    if (!commune) {
      return
    }

    const voies = model.getVoies(codeCommune)
    voies.forEach(voie => {
      csvStream.write({
        id: voie.id,
        type_voie: voie.typeVoie,
        date_ajout: voie.dateAjout,
        date_annulation: voie.dateAnnulation,
        code_fantoir: voie.codeFantoir,
        code_commune: voie.codeCommune,
        nom_commune: getNomCommune(voie.codeCommune) || '',
        libelle: model.getLibelleVoie(voie.id).join(' => '),
        successeur: voie.successeur ? voie.successeur.id : '',
        predecesseur: voie.predecesseur ? voie.predecesseur.id : '',
        ancienne_commune: voie.predecesseur ? (getNomCommune(voie.predecesseur.codeCommune) || '') : ''
      })
    })
  })

  csvStream.end()

  return finished(csvStream)
}

module.exports = {exportAsCsv}
