#!/usr/bin/env node
const csvWriter = require('csv-write-stream')
const {parseStream, FIELDS} = require('../lib/parse/stream')

process.stdin
  .pipe(parseStream())
  .pipe(csvWriter({
    headers: FIELDS
  }))
  .pipe(process.stdout)
