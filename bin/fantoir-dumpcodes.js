#!/usr/bin/env node
const csvWriter = require('csv-write-stream')
const {through} = require('mississippi')
const {parseStream} = require('../lib/parse/stream')

let currentCommune

process.stdin
  .pipe(parseStream())
  .pipe(through.obj((record, enc, cb) => {
    if (record.code_commune !== currentCommune) {
      currentCommune = record.code_commune
      console.error('Commune ' + currentCommune)
    }
    cb(null, {
      code_commune: record.code_commune,
      code_rivoli: record.code_rivoli,
      annee_annulation: record.annee_annulation
    })
  }))
  .pipe(csvWriter())
  .pipe(process.stdout)
