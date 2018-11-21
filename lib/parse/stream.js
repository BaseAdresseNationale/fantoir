const split = require('split2')
const {pipeline, through} = require('mississippi')
const getStream = require('get-stream')

const {parseVoie} = require('./voie')
const {parseCommune} = require('./commune')

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
  'date_annulation',
  'date_ajout',
  'type_annulation',
  'lieu_dit_bati',
  'mot_directeur'
]

function flatten(record) {
  return Buffer.from(record).toString()
}

function isAlphaNumeric(char) {
  return (char >= '0' && char <= '9') || (char >= 'A' && char <= 'Z')
}

function parseRecord(record, accept = ['voie']) {
  // EOF
  if (record.substr(0, 6) === '999999') {
    if (accept.includes('eof')) {
      return {type: 'eof'}
    }
    return
  }
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
    if (accept.includes('commune')) {
      return parseCommune(flatten(record))
    }
    return
  }

  // Voie
  if (accept.includes('voie')) {
    return parseVoie(flatten(record))
  }
}

function parseStream(options = {}) {
  const accept = options.accept || ['voie']
  return pipeline.obj(
    split(),
    through.obj(function (chunk, enc, cb) {
      const parsedValue = parseRecord(chunk, accept)
      if (parsedValue) {
        this.push(parsedValue)
      }
      cb()
    })
  )
}

function streamToRecords(stream) {
  return getStream.array(
    pipeline.obj(
      stream,
      parseStream()
    )
  )
}

module.exports = {
  streamToRecords,
  parseStream,
  FIELDS
}
