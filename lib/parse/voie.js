const {isArray} = require('lodash')
const naturesVoies = require('../../data/natures_voies.json')
const {extractDates, parseCodeDepartement} = require('./util')

const TYPE_VOIE = {
  1: 'voie',
  2: 'ensemble immobilier',
  3: 'lieu-dit',
  4: 'pseudo-voie',
  5: 'voie provisoire'
}

function parseVoie(record) {
  const codeTypeVoie = record.charAt(108)
  const typeVoie = TYPE_VOIE[codeTypeVoie]

  const dates = extractDates(record)

  const result = {
    type: 'voie',
    code_type_voie: codeTypeVoie,
    type_voie: typeVoie,
    code_departement: parseCodeDepartement(record),
    code_commune: record.substr(0, 2) + record.substr(3, 3),
    code_rivoli: record.substr(6, 4),
    cle_rivoli: record.charAt(10),
    libelle_voie: record.substr(15, 26).trim(),
    voie_privee: record.substr(48, 1) === '1',
    code_majic: record.substr(103, 5),
    mot_directeur: record.substr(112, 8).trim(),
    ...dates
  }

  result.id = `${result.code_commune}-${result.code_rivoli}`
  result.hid = `voie:${result.id}@${dates.date_ajout}`

  const codeNatureVoie = record.substr(11, 4).trim()
  if (codeNatureVoie.length > 0) {
    result.code_nature_voie = codeNatureVoie
    if (codeNatureVoie in naturesVoies) {
      const natureVoie = naturesVoies[codeNatureVoie]
      result.nature_voie = isArray(natureVoie) ? natureVoie[0] : natureVoie
    } else {
      result.nature_voie = codeNatureVoie
    }
  }

  result.libelle_voie_complet = buildLibelleVoieComplet(result.nature_voie, result.libelle_voie)

  if (typeVoie === 'lieu-dit') {
    result.lieu_dit_bati = record.charAt(109) === '1'
  }

  return result
}

function buildLibelleVoieComplet(natureVoie, libelleVoie) {
  if (!natureVoie || natureVoie === libelleVoie || libelleVoie.startsWith(natureVoie)) {
    return libelleVoie
  }
  if (natureVoie === 'GRANDE RUE' && libelleVoie.startsWith('GRAND RUE')) {
    return libelleVoie
  }
  return natureVoie + ' ' + libelleVoie
}

module.exports = {parseVoie}
