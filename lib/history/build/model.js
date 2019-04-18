const {uniq} = require('lodash')

function initCommune(commune) {
  return {...commune, voies: new Map()}
}

function initVoie(voie) {
  return {
    id: voie.id,
    dateAjout: voie.dateAjout,
    libelle: [],
    typeVoie: voie.typeVoie,
    codeCommune: voie.codeCommune,
    codeFantoir: voie.codeRivoli
  }
}

class Model {
  constructor() {
    this._communesIndex = new Map()
    this._cancelledCommunes = new Set()
    this._handledCancelledCommunes = new Set()
    this._addedVoies = new Set()
  }

  upsertCommune(commune) {
    const codeCommune = commune.id

    if (commune.dateAnnulation && !this._handledCancelledCommunes.has(codeCommune)) {
      this.addCancelledCommune(codeCommune)
    }

    if (this._communesIndex.has(codeCommune)) {
      return this._communesIndex.get(codeCommune)
    }

    const newCommune = initCommune(commune)
    this._communesIndex.set(codeCommune, newCommune)
    return newCommune
  }

  upsertVoie(rawVoie, rawCommune) {
    const codeVoie = rawVoie.codeRivoli

    const commune = this.upsertCommune(rawCommune)

    if (commune.voies.has(codeVoie)) {
      return commune.voies.get(codeVoie)
    }

    const newVoie = initVoie(rawVoie)
    this._addedVoies.add(newVoie)
    commune.voies.set(codeVoie, newVoie)
    return newVoie
  }

  getVoies(codeCommune) {
    return [...this._communesIndex.get(codeCommune).voies.values()]
  }

  getVoie(codeCommune, codeVoie) {
    const commune = this._communesIndex.get(codeCommune)
    if (commune) {
      return commune.voies.get(codeVoie)
    }
  }

  getLibelleVoie(idVoie) {
    const codeCommune = idVoie.substr(0, 5)
    const codeVoie = idVoie.substr(6, 4)
    const voie = this.getVoie(codeCommune, codeVoie)

    if (!voie) {
      console.log(idVoie)
      throw new Error('Voie inconnue')
    }

    if (!voie.predecesseur) {
      return uniq(voie.libelle)
    }

    return uniq(this.getLibelleVoie(voie.predecesseur.id).concat(voie.libelle))
  }

  hasCommune(codeCommune) {
    return this._communesIndex.has(codeCommune)
  }

  getCommunes() {
    return [...this._communesIndex.values()]
  }

  addCancelledCommune(codeCommune) {
    this._cancelledCommunes.add(codeCommune)
  }

  getCancelledCommunes() {
    return [...this._cancelledCommunes]
  }

  cleanup() {
    this._addedVoies.forEach(v => {
      if (v.predecesseur === undefined) {
        v.predecesseur = false
      }
    })
    this._addedVoies.clear()

    this.getCancelledCommunes().forEach(c => {
      this._handledCancelledCommunes.add(c)
    })
    this._cancelledCommunes.clear()
  }
}

module.exports = Model
