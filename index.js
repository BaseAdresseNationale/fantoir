const {createReadStream} = require('fs')
const {createGunzip} = require('gunzip-stream')
const {pipeline} = require('mississippi')
const {parseStream} = require('@etalab/fantoir-parser')

const {InMemoryDatabase} = require('./lib/db/in-memory')
const {SQLiteDatabase} = require('./lib/db/sqlite')

async function createRawDatabase(path, options) {
  const records = await parseStream(
    pipeline(
      createReadStream(path),
      createGunzip()
    )
  )
  return new InMemoryDatabase(records, {searchable: false, ...options})
}

function createSqliteDatabase(path) {
  return new SQLiteDatabase(path)
}

function createDatabase(path, options = {}) {
  if (options.type === 'sqlite') {
    return createSqliteDatabase(path, options)
  }

  return createRawDatabase(path, options)
}

module.exports = {createDatabase}
