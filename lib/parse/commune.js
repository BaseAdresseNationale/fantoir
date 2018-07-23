function parseCodeDepartement(record) {
  if (record.substr(0, 2) === '97') {
    return record.substr(0, 3)
  }
  return record.substr(0, 2)
}

function parseCommune(record) {
  const result = {
    type: 'commune',
    code_departement: parseCodeDepartement(record),
    code_commune: record.substr(0, 2) + record.substr(3, 3),
    cle_rivoli: record.charAt(10),
    libelle_commune: record.substr(11, 30).trim()
  }

  result.id = `${result.code_commune}`

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

  return result
}

module.exports = {parseCommune}
