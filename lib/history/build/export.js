const {promisify} = require('util')
const {createWriteStream} = require('fs')
const {createGzip} = require('zlib')
const csvWriter = require('csv-write-stream')
const {pipeline} = require('mississippi')
const finished = promisify(require('mississippi').finished)
const {getNomCommune} = require('./cog')

function exportAsCsv(model, destPath) {
  const csvStream = pipeline.obj(
    csvWriter(),
    createGzip(),
    createWriteStream(destPath)
  )

  model.getCommunes().forEach(commune => {
    const voies = model.getVoies(commune.id)
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
