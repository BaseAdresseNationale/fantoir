const split = require('split2')
const {pipeline, through} = require('mississippi')

const {parseVoie} = require('./voie')

const FIELDS = [
  'id',
  'code_type_voie',
  'type_voie',
  'code_departement',
  'code_commune',
  'code_rivoli',
  'cle_rivoli',
  'libelle_voie',
  'voie_privee',
  'code_majic',
  'code_nature_voie',
  'nature_voie',
  'annee_annulation',
  'annee_ajout',
  'type_annulation',
  'lieu_dit_bati',
  'mot_directeur'
]

function isAlphaNumeric(char) {
  return (char >= '0' && char <= '9') || (char >= 'A' && char <= 'Z')
}

function parseRecord(record) {
  // Initial record
  if (!isAlphaNumeric(record.charAt(0))) {
    return
  }
  // Direction record
  if (!isAlphaNumeric(record.charAt(3))) {
    return
  }
  // Commune record
  if (!isAlphaNumeric(record.charAt(6))) {
    return
  }

  return parseVoie(record)
}

function parseStream(options = {}) {
  return pipeline.obj(
    split(),
    through.obj(function (chunk, enc, cb) {
      const parsedValue = parseRecord(chunk)
      if (parsedValue && (!options.filter || options.filter(parsedValue))) {
        this.push(options.transform ? options.transform(parsedValue) : parsedValue)
      }
      cb()
    })
  )
}

module.exports = {
  parseStream,
  FIELDS
}
