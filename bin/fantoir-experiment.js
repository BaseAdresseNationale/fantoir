#!/usr/bin/env node --max_old_space_size=8192
const {promisify} = require('util')
const {join} = require('path')
const chalk = require('chalk')
const {createGunzip} = require('gunzip-stream')
const {through} = require('mississippi')
const pipe = promisify(require('mississippi').pipe)
const {last} = require('lodash')
const {parseStream} = require('../lib/parse/stream')
const Model = require('../lib/history/build/model')
const {datesNearlyEquals} = require('../lib/history/build/dates')
const {handleCancelledCommunes} = require('../lib/history/build/cancelled-communes')
const {exportAsCsv} = require('../lib/history/build/export')

const destPath = join(__dirname, '..', 'fantoir.csv.gz')

async function main() {
  const model = new Model()
  let currentCommune

  await pipe(
    process.stdin,
    createGunzip(),
    parseStream({accept: ['commune', 'voie', 'eof']}),
    through.obj(
      (record, enc, cb) => {
        if (record.type === 'voie') {
          const voie = model.upsertVoie(record, currentCommune)
          if (voie.libelle.length === 0 || last(voie.libelle) !== record.libelle_voie_complet) {
            voie.libelle.push(record.libelle_voie_complet)
          }
          if (!voie.annulee && record.date_annulation) {
            voie.annulee = true
            voie.dateAnnulation = record.date_annulation
            voie.transferee = record.type_annulation === 'avec transfert'
            if (datesNearlyEquals(record.date_annulation, currentCommune.date_annulation)) {
              voie.annulationCommune = currentCommune.date_annulation
            }
          }
          voie.nomCommune = currentCommune.libelle_commune
        }
        if (record.type === 'commune') {
          model.upsertCommune(record)
          currentCommune = record
        }
        if (record.type === 'eof') {
          console.log(chalk.gray('-- End of file --'))
          handleCancelledCommunes(model)
          model.cleanup()
        }
        cb()
      },
      cb => {
        handleCancelledCommunes(model)
        model.cleanup()
        cb()
      }
    )
  )

  await exportAsCsv(model, destPath)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
