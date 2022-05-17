const Keyv = require('keyv')
const leven = require('leven')
const {min, keyBy, minBy} = require('lodash')
const {extractSignificantWords, normalizeBase, phonetizeWords, overlap} = require('@etalab/adresses-util/lib/voies')

let fantoirDatabase

async function getFantoirCommuneData(codeCommune, fantoirPath) {
  if (!fantoirDatabase) {
    fantoirDatabase = new Keyv(`sqlite://${fantoirPath}`)
  }

  const fantoirCommune = await fantoirDatabase.get(codeCommune)

  if (!fantoirCommune) {
    return []
  }

  return fantoirCommune
    .filter(item => item.libelleVoieComplet !== 'RUE')
    .map(item => {
      return {
        ...item,
        libelleStringContexts: item.libelle.map(computeStringContext)
      }
    })
}

function computeStringContext(str) {
  const normalizedString = normalizeBase(str)
  const significantWords = extractSignificantWords(normalizedString)
  const significantWordsString = significantWords.join(' ')
  const phoneticString = phonetizeWords(significantWords)
  return {normalizedString, phoneticString, significantWords, significantWordsString}
}

function selectBestResult(results, baseScore, ctx) {
  const activeResults = results.filter(r => !r.dateAnnulation)

  const scoredResults = (activeResults.length > 1 ? activeResults : results).map(r => {
    const minLeven = min(r.libelleStringContexts.map(strContext => {
      return leven(ctx.significantWordsString, strContext.significantWordsString)
    }))

    const malusTypeVoie = r.typeVoie !== 'voie'

    return {...r, score: baseScore + (10 * minLeven) + malusTypeVoie}
  })

  return minBy(scoredResults, 'score')
}

async function createFantoirCommune(codeCommune, options = {}) {
  const fantoirPath = options.fantoirPath || process.env.FANTOIR_PATH

  if (!fantoirPath) {
    throw new Error('Le chemin vers la base FANTOIR doit être renseigné via l’option dbPath ou la variable d’environnement FANTOIR_PATH')
  }

  const fantoirCommune = await getFantoirCommuneData(codeCommune, fantoirPath)
  const index = keyBy(fantoirCommune, 'id')

  const stats = {
    significantWords: 0,
    phonetic: 0,
    overlap: 0,
    failed: 0,
    tooShort: 0
  }

  function scopedFantoirCommune(communeScope) {
    if (communeScope) {
      return fantoirCommune.filter(e => e.codeCommune === communeScope)
    }

    return fantoirCommune
  }

  function findVoie(nomVoie, communeScope, forceScope = false) {
    const ctx = computeStringContext(nomVoie)

    if (ctx.significantWords.length < 2) {
      stats.tooShort++
      return
    }

    const scopedFantoir = scopedFantoirCommune(communeScope)

    // SIGNIFICANT WORDS
    const significantWordsCompareResults = scopedFantoir.filter(fantoirItem => {
      return fantoirItem.libelleStringContexts.some(lsc => {
        return lsc.significantWordsString === ctx.significantWordsString
      })
    })

    if (significantWordsCompareResults.length > 0) {
      stats.significantWords++
      return selectBestResult(significantWordsCompareResults, 1000, ctx)
    }

    // PHONETIC
    const phoneticCompareResults = scopedFantoir.filter(fantoirItem => {
      return fantoirItem.libelleStringContexts.some(lsc => {
        return lsc.phoneticString === ctx.phoneticString
      })
    })

    if (phoneticCompareResults.length > 0) {
      stats.phonetic++
      return selectBestResult(phoneticCompareResults, 2000, ctx)
    }

    // OVERLAPPING
    const overlapCompareResults = scopedFantoir.filter(fantoirItem => {
      return fantoirItem.libelleStringContexts.some(lsc => {
        return overlap(ctx.significantWords, lsc.significantWords)
      })
    })

    if (overlapCompareResults.length > 0) {
      stats.overlap++
      return selectBestResult(overlapCompareResults, 3000, ctx)
    }

    if (communeScope && !forceScope) {
      return findVoie(nomVoie)
    }

    stats.failed++
  }

  return {
    findVoie,

    getVoie(idVoie) {
      return index[idVoie]
    },

    getStats() {
      return stats
    }
  }
}

module.exports = {createFantoirCommune}
