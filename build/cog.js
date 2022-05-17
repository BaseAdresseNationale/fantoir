const {keyBy} = require('lodash')

const communes = require('@etalab/decoupage-administratif/data/communes.json')
  .filter(c => ['commune-actuelle', 'arrondissement-municipal'].includes(c.type))

communes.find(c => c.code === '97701').anciensCodes = ['97123']
communes.find(c => c.code === '97801').anciensCodes = ['97127']

const communesIndex = keyBy(communes, 'code')

const anciensCodesIndex = new Map()

for (const commune of communes) {
  if (commune.anciensCodes) {
    for (const ancienCode of commune.anciensCodes) {
      anciensCodesIndex.set(ancienCode, commune)
    }
  }
}

function getCommuneActuelle(codeCommune) {
  if (codeCommune in communesIndex) {
    return communesIndex[codeCommune]
  }

  return anciensCodesIndex.get(codeCommune)
}

function getCommunes() {
  return communes
}

module.exports = {getCommunes, getCommuneActuelle}
