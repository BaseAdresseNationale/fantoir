const {isArray} = require('lodash')
const naturesVoies = require('../../data/natures_voies.json')

const TYPE_VOIE = {
  1: 'voie',
  2: 'ensemble immobilier',
  3: 'lieu-dit',
  4: 'pseudo-voie',
  5: 'voie provisoire'
}

function parseCodeDepartement(record) {
  if (record.substr(0, 2) === '97') {
    return record.substr(0, 3)
  }
  return record.substr(0, 2)
}

function parseVoie(record) {
  const codeTypeVoie = record.charAt(108)
  const typeVoie = TYPE_VOIE[codeTypeVoie]

  const result = {
    id: record.substr(0, 10),
    code_type_voie: codeTypeVoie,
    type_voie: typeVoie,
    code_departement: parseCodeDepartement(record),
    code_commune: record.substr(0, 2) + record.substr(3, 3),
    code_rivoli: record.substr(6, 4),
    cle_rivoli: record.charAt(10),
    libelle_voie: record.substr(15, 26).trim(),
    voie_privee: record.substr(48, 1) === '1',
    code_majic: record.substr(103, 5),
    mot_directeur: record.substr(112, 8).trim()
  }

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

  const anneeAjout = record.substr(81, 4)
  if (anneeAjout !== '0000') {
    result.annee_ajout = anneeAjout
  }

  const annulation = record.charAt(73)
  if (annulation === 'Q') {
    result.type_annulation = 'avec transfert'
  }
  if (annulation === 'O') {
    result.type_annulation = 'sans transfert'
  }

  const anneeAnnulation = record.substr(74, 4)
  if (anneeAnnulation !== '0000') {
    result.annee_annulation = anneeAnnulation
  }

  if (typeVoie === 'lieu-dit') {
    result.lieu_dit_bati = record.charAt(109) === '1'
  }

  return result
}

module.exports = {parseVoie}
