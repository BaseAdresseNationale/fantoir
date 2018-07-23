const {extractDates, parseCodeDepartement} = require('./util')

function parseCommune(record) {
  const dates = extractDates(record)

  const result = {
    type: 'commune',
    code_departement: parseCodeDepartement(record),
    code_commune: record.substr(0, 2) + record.substr(3, 3),
    cle_rivoli: record.charAt(10),
    libelle_commune: record.substr(11, 30).trim(),
    ...dates
  }

  result.id = `${result.code_commune}`

  return result
}

module.exports = {parseCommune}
