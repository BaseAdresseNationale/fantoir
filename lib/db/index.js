const {keyBy, groupBy, flatten} = require('lodash')
const fuzzyset = require('fuzzyset.js')

class InMemoryDatabase {

  constructor(records = [], options = {}) {
    this._records = records

    this._idIndex = keyBy(this._records, 'id')

    if (options.searchable) {
      this._labelIndex = groupBy(this._records, 'libelle_voie_complet')
      this._fuzzyset = fuzzyset(this._records.map(r => r.libelle_voie_complet))
    }
  }

  get(id) {
    return this._idIndex[id]
  }

  subset(predicate, options = {}) {
    return new InMemoryDatabase(
      this._records.filter(predicate),
      options
    )
  }

  commune(codeCommune, searchable = true) {
    return this.subset(r => r.code_commune === codeCommune, {searchable})
  }

  search(text) {
    if (!this._fuzzyset) {
      throw new Error('Database not searchable')
    }
    return flatten(this._fuzzyset.get(text, [], 0.5).map(([score, matchingEntry]) => {
      return this._labelIndex[matchingEntry].map(record => ({
        ...record,
        score
      }))
    }))
  }

  get size() {
    return this._records.length
  }

  get records() {
    return this._records
  }

}

module.exports = {InMemoryDatabase}
