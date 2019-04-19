const chalk = require('chalk')
const {first, last, chain, memoize} = require('lodash')
const {datesNearlyEquals} = require('./dates')

function datesMatch(v1, v2) {
  return datesNearlyEquals(v1.dateAnnulation, v2.dateAjout)
}

const normalize = memoize(str => {
  return str.replace(/\W+/g, '').trim()
})

function findExact(voie, voiesPotentielles) {
  const libelle = last(voie.libelle)
  return chain(voiesPotentielles)
    .filter(v => v.predecesseur === undefined && datesMatch(voie, v))
    .filter(v => `${normalize(libelle)} ${normalize(voie.nomCommune)}` === normalize(first(v.libelle)) ||
    normalize(libelle) === normalize(first(v.libelle)))
    .value()
}

function matchVoies(voiesTransferees, voiesPotentielles) {
  const matchResults = voiesTransferees
    .map(voieTransferee => {
      const matchResult = {voieTransferee}
      matchResult.exact = findExact(voieTransferee, voiesPotentielles)

      if (matchResult.exact.length > 1) {
        const libelle = last(voieTransferee.libelle)
        console.log(chalk.yellow(`${voieTransferee.id} | ${voieTransferee.typeVoie} | ${libelle} | Plusieurs successeurs trouvés`))
        matchResult.finished = 'failed'
      }

      return matchResult
    })

  chain(matchResults)
    .filter(matchResult => matchResult.exact.length === 1)
    .groupBy(matchResult => matchResult.exact[0].id)
    .forEach(gMatchResults => {
      const successeurPotentiel = gMatchResults[0].exact[0]

      if (gMatchResults.length === 1) {
        const [matchResult] = gMatchResults
        matchResult.voieTransferee.successeur = successeurPotentiel
        matchResult.finished = 'success'
        successeurPotentiel.predecesseur = matchResult.voieTransferee
      } else {
        const libelle = first(successeurPotentiel.libelle)
        console.log(chalk.yellow(`${successeurPotentiel.id} | ${libelle} | La voie a plusieurs prédécesseurs possibles`))
        gMatchResults.forEach(matchResult => {
          matchResult.finished = 'failed'
        })
      }
    })
    .value()
}

module.exports = {
  matchVoies
}
