#!/usr/bin/env node --max_old_space_size=8192
const {promisify} = require('util')
const {join} = require('path')
const {Transform} = require('stream')
const pipeline = promisify(require('stream').pipeline)
const debug = require('debug')('fantoir:build')
const {createGunzip} = require('gunzip-stream')
const {last} = require('lodash')
const {createParser} = require('@etalab/fantoir-parser')
const Model = require('./model')
const {datesNearlyEquals} = require('./dates')
const {handleCancelledCommunes} = require('./cancelled-communes')
const {exportAsKeyValueStore} = require('./export')

const destPath = join(__dirname, '..', 'fantoir.sqlite')

async function main() {
  const model = new Model()
  let currentCommune

  debug('start processing input file')

  await pipeline(
    process.stdin,
    createGunzip(),
    createParser({accept: ['commune', 'voie', 'eof'], dateFormat: 'integer'}),
    new Transform({
      objectMode: true,
      transform(record, enc, cb) {
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
          debug('end of file')
          debug('post-processing communes annulées')
          handleCancelledCommunes(model)
          debug('continue processing')
          model.cleanup()
        }

        cb()
      },
      flush(cb) {
        debug('post-processing communes annulées')
        handleCancelledCommunes(model)
        model.cleanup()
        debug('end of processing')
        cb()
      }
    })
  )

  debug('start exporting as KV store')
  await exportAsKeyValueStore(model, destPath)
  debug('end exporting as KV store')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
