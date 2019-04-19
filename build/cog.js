const {keyBy} = require('lodash')
const communes = require('@etalab/cog/data/communes.json')

const cogCommunesIndex = keyBy(communes, 'code')

const MARSEILLE_MAPPING = {
  13331: '13201',
  13332: '13202',
  13333: '13203',
  13334: '13204',
  13335: '13205',
  13336: '13206',
  13337: '13207',
  13338: '13208',
  13339: '13209',
  13340: '13210',
  13341: '13211',
  13342: '13212',
  13343: '13213',
  13344: '13214',
  13345: '13215',
  13346: '13216'
}

const NOMS_OVERRIDES = {
  '06900': 'Monaco',
  97123: 'Saint-Barthélemy',
  97127: 'Saint-Martin'
}

function normalizeCodeCommune(codeCommune) {
  if (codeCommune in MARSEILLE_MAPPING) {
    return MARSEILLE_MAPPING[codeCommune]
  }

  return codeCommune
}

function getCommune(codeCommune) {
  codeCommune = normalizeCodeCommune(codeCommune)
  return cogCommunesIndex[codeCommune]
}

function getCommuneActuelle(codeCommune) {
  const commune = getCommune(codeCommune)
  if (!commune) {
    return
  }

  if (commune.type === 'commune-actuelle' || commune.type === 'arrondissement-municipal') {
    return codeCommune
  }

  if (commune.type === 'ancien-code') {
    return getCommuneActuelle(commune.nouveauCode)
  }

  if (commune.type === 'commune-deleguee' || commune.type === 'commune-associee') {
    return getCommuneActuelle(commune.chefLieu)
  }

  if (commune.type === 'commune-perimee') {
    return getCommuneActuelle(commune.communeAbsorbante)
  }

  throw new Error(`Type de commune non prévu : ${commune.type}`)
}

function getNomCommune(codeCommune) {
  if (codeCommune in NOMS_OVERRIDES) {
    return NOMS_OVERRIDES[codeCommune]
  }

  const commune = getCommune(codeCommune)
  if (!commune) {
    throw new Error('Code commune inconnue : ' + codeCommune)
  }

  return commune.nom
}

module.exports = {getCommuneActuelle, getNomCommune, getCommune}
