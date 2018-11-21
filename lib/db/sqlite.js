const Keyv = require('keyv')
const {parseBuffer} = require('@etalab/fantoir-parser')
const {InMemoryDatabase} = require('./in-memory')

class SQLiteDatabase {
  constructor(path) {
    this._keyv = new Keyv(`sqlite://${path}`)
  }

  async commune(codeCommune) {
    const communeContent = await this._keyv.get(codeCommune)
    if (communeContent) {
      const records = await parseBuffer(communeContent)
      return new InMemoryDatabase(records, {searchable: true})
    }
  }
}

module.exports = {SQLiteDatabase}
