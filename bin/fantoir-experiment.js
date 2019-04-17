#!/usr/bin/env node --max_old_space_size=8192
const {promisify} = require('util')
const {join} = require('path')
const pipeline = promisify(require('stream').pipeline)
const chalk = require('chalk')
const {createGunzip} = require('gunzip-stream')
const through = require('through2')
const {last} = require('lodash')
const {createParser} = require('@etalab/fantoir-parser')
const Model = require('../lib/history/build/model')
const {datesNearlyEquals} = require('../lib/history/build/dates')
const {handleCancelledCommunes} = require('../lib/history/build/cancelled-communes')
const {exportAsCsv} = require('../lib/history/build/export')

const destPath = join(__dirname, '..', 'fantoir.csv.gz')

async function main() {
  const model = new Model()
  let currentCommune

  await pipeline(
    process.stdin,
    createGunzip(),
    createParser({accept: ['commune', 'voie', 'eof']}),
    through.obj(
      (record, enc, cb) => {
        if (record.type === 'voie') {
          const voie = model.upsertVoie(record, currentCommune)
          if (voie.libelle.length === 0 || last(voie.libelle) !== record.libelleVoieComplet) {
            voie.libelle.push(record.libelleVoieComplet)
          }

          if (!voie.annulee && record.dateAnnulation) {
            voie.annulee = true
            voie.dateAnnulation = record.dateAnnulation
            voie.transferee = record.typeAnnulation === 'avec transfert'
            if (datesNearlyEquals(record.dateAnnulation, currentCommune.dateAnnulation)) {
              voie.annulationCommune = currentCommune.dateAnnulation
            }
          }

          voie.nomCommune = currentCommune.nomCommune
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
