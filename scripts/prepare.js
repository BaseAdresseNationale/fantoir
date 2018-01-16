const csvParser = require('csv-parser')
const fs = require('fs')

const inputFile = __dirname + '/../data/natures_voies.csv'
const outputFile = __dirname + '/../data/natures_voies.json'

const naturesVoies = {}

fs.createReadStream(inputFile, {encoding: 'utf8'})
  .pipe(csvParser())
  .on('data', row => {
    const {code, libelle} = row
    naturesVoies[code] = libelle.includes(';') ? libelle.split(';') : libelle
  })
  .on('end', () => {
    fs.writeFileSync(outputFile, JSON.stringify(naturesVoies), {encoding: 'utf8'})
    process.exit(0)
  })
