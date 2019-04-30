const Keyv = require('keyv')
const leven = require('leven')
const {maxBy, keyBy} = require('lodash')
const {extractSignificantWords, normalizeBase, phonetizeWords, overlap} = require('@etalab/adresses-util/lib/voies')

if (!process.env.FANTOIR_PATH) {
  throw new Error('La variable d’environnement FANTOIR_PATH doit être renseignée')
}

const fantoirDatabase = new Keyv(`sqlite://${process.env.FANTOIR_PATH}`)

async function getFantoirCommuneData(codeCommune) {
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

function selectBestResult(results, ctx) {
  const activeResults = results.filter(r => !r.dateAnnulation)
  if (activeResults.length === 1) {
    return activeResults[0]
  }

  return maxBy(activeResults.length > 1 ? activeResults : results, r => {
    return -maxBy(r.libelleStringContexts, strContext => {
      return leven(ctx.normalizedString, strContext.normalizedString)
    })
  })
}

async function createFantoirCommune(codeCommune) {
  const fantoirCommune = await getFantoirCommuneData(codeCommune)
  const index = keyBy(fantoirCommune, 'id')

  const stats = {
    significantWords: 0,
    phonetic: 0,
    overlap: 0,
    failed: 0,
    tooShort: 0
  }

  function findVoie(nomVoie) {
    const ctx = computeStringContext(nomVoie)

    if (ctx.significantWords.length < 2) {
      stats.tooShort++
      return
    }

    // SIGNIFICANT WORDS
    const significantWordsCompareResults = fantoirCommune.filter(fantoirItem => {
      return fantoirItem.libelleStringContexts.some(lsc => {
        return lsc.significantWordsString === ctx.significantWordsString
      })
    })

    if (significantWordsCompareResults.length > 0) {
      stats.significantWords++
      return selectBestResult(significantWordsCompareResults, ctx)
    }

    // PHONETIC
    const phoneticCompareResults = fantoirCommune.filter(fantoirItem => {
      return fantoirItem.libelleStringContexts.some(lsc => {
        return lsc.phoneticString === ctx.phoneticString
      })
    })

    if (phoneticCompareResults.length > 0) {
      stats.phonetic++
      return selectBestResult(phoneticCompareResults, ctx)
    }

    // OVERLAPPING
    const overlapCompareResults = fantoirCommune.filter(fantoirItem => {
      return fantoirItem.libelleStringContexts.some(lsc => {
        return overlap(ctx.significantWords, lsc.significantWords)
      })
    })

    if (overlapCompareResults.length > 0) {
      stats.overlap++
      return selectBestResult(overlapCompareResults, ctx)
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
