function parseDate(str) {
  if (str.length !== 7) {
    throw new Error('parseDate is expecting a string with size 7. Given: ' + str.length)
  }
  const year = str.substr(0, 4)
  const dayOfYear = str.substr(4, 3)
  const date = new Date(year + '-01-01') // UTC
  date.setDate(dayOfYear)
  return date.toISOString().substr(0, 10)
}

function parseCodeDepartement(str) {
  if (str.substr(0, 2) === '97') {
    return str.substr(0, 3)
  }
  return str.substr(0, 2)
}

function extractDates(record) {
  const result = {}

  const dateAjout = record.substr(81, 7)
  if (dateAjout === '0000000') {
    throw new Error('Données inattendues : date d’ajout manquante')
  }
  result.date_ajout = parseDate(dateAjout)

  const annulation = record.charAt(73)
  if (annulation === 'Q') {
    result.type_annulation = 'avec transfert'
  }
  if (annulation === 'O') {
    result.type_annulation = 'sans transfert'
  }

  const dateAnnulation = record.substr(74, 7)
  if (dateAnnulation !== '0000000') {
    result.date_annulation = parseDate(dateAnnulation)
  }

  return result
}

module.exports = {parseDate, parseCodeDepartement, extractDates}
