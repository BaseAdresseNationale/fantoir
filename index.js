const {createReadStream} = require('fs')
const {createGunzip} = require('gunzip-stream')

const {pipeline, each} = require('mississippi')

const {parseStream} = require('./lib/parse/stream')
const {InMemoryDatabase} = require('./lib/db')

function createDatabase(path, options = {}) {
  return new Promise((resolve, reject) => {
    const fileStream = pipeline.obj(createReadStream(path), createGunzip(), parseStream())
    const records = []
    each(fileStream, (record, next) => {
      if (!options.filter || options.filter(record)) {
        records.push(record)
      }
      next()
    }, err => {
      if (err) {
        return reject(err)
      }
      resolve(new InMemoryDatabase(records, {searchable: false, ...options}))
    })
  })
}

module.exports = {createDatabase}
