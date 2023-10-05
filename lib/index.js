const Keyv = require('keyv')
const leven = require('leven')
const {uniq, chain, min, keyBy, minBy, maxBy} = require('lodash')
const {extractSignificantWords, normalizeBase, phonetizeWords, overlap} = require('@etalab/adresses-util/lib/voies')
const {getCommuneActuelle} = require('./cog')

let fantoirDatabase

async function getFantoirCommuneData(codeCommune, withAnciennesCommunes, fantoirPath) {
  if (!fantoirDatabase) {
    fantoirDatabase = new Keyv(`sqlite://${fantoirPath}`)
  }

  let fantoirCommune

  const communeActuelle = getCommuneActuelle(codeCommune)

  if (communeActuelle.code === codeCommune && withAnciennesCommunes) {
    const codesCommunes = uniq([codeCommune, ...(communeActuelle.anciensCodes || [])])
    const fantoirCommunes = await Promise.all(
      codesCommunes.map(c => fantoirDatabase.get(c))
    )
    fantoirCommune = chain(fantoirCommunes).compact().flatten().value()
  } else {
    fantoirCommune = await fantoirDatabase.get(codeCommune)
  }

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

function selectBestResult(nomVoieMaj, results, baseScore, ctx) {
  const activeResults = results

  const scoredResults = (activeResults.length > 0 ? activeResults : results).map(r => {
    const minLeven = min(r.libelleStringContexts.map(stringContext => {
      const pos1 = ctx.significantWordsString.indexOf('(')
      const cleaned1 = pos1 > 0 ? ctx.significantWordsString.slice(0, pos1) : ctx.significantWordsString
      const pos2 = stringContext.significantWordsString.indexOf('(')
      const cleaned2 = pos2 > 0 ? stringContext.significantWordsString.slice(0, pos2) : stringContext.significantWordsString

      return leven(cleaned1, cleaned2)
    }
    ))
    const malusTypeVoie = r.typeVoie !== 'voie'

    const levenMaj = leven(nomVoieMaj, r.libelle.toString())

    return {...r, score: baseScore + (10 * (minLeven + levenMaj)) + malusTypeVoie}
  })
  // Si le meilleur score est une voie annulée avec successeur ou si le meilleur score est une voie non annulée, on la renvoie

  const bestResult = minBy(scoredResults, 'score')
  if ((bestResult.annulee && bestResult.successeur) || (!bestResult.annulee)) {
    return bestResult
  }

  // Sinon on renvoie le max (si un seul result alors max = min)
  return maxBy(scoredResults, 'score')
}

async function createFantoirCommune(codeCommune, options = {}) {
  const fantoirPath = options.fantoirPath || process.env.FANTOIR_PATH
  const withAnciennesCommunes = options.withAnciennesCommunes !== false

  if (!fantoirPath) {
    throw new Error('Le chemin vers la base FANTOIR doit être renseigné via l’option dbPath ou la variable d’environnement FANTOIR_PATH')
  }

  const fantoirCommune = await getFantoirCommuneData(codeCommune, withAnciennesCommunes, fantoirPath)
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
    // On nettoie tout ce qu'il y a après une parenthèse ouvrante.
    const pos = nomVoie.indexOf('(')
    const nomVoieCleaned = pos > 0 ? nomVoie.slice(0, pos) : nomVoie

    const ctx = computeStringContext(nomVoieCleaned)
    const nomVoieMaj = nomVoieCleaned.toUpperCase()

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
      return selectBestResult(nomVoieMaj, significantWordsCompareResults, 1000, ctx)
    }

    // PHONETIC
    const phoneticCompareResults = scopedFantoir.filter(fantoirItem => {
      return fantoirItem.libelleStringContexts.some(lsc => {
        return lsc.phoneticString === ctx.phoneticString
      })
    })

    if (phoneticCompareResults.length > 0) {
      stats.phonetic++
      return selectBestResult(nomVoieMaj, phoneticCompareResults, 2000, ctx)
    }

    // OVERLAPPING
    const overlapCompareResults = scopedFantoir.filter(fantoirItem => {
      return fantoirItem.libelleStringContexts.some(lsc => {
        return overlap(ctx.significantWords, lsc.significantWords)
      })
    })

    if (overlapCompareResults.length > 0) {
      stats.overlap++
      return selectBestResult(nomVoieMaj, overlapCompareResults, 3000, ctx)
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
