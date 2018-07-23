const test = require('ava')
const {parseVoie} = require('../lib/parse/voie')

test('parse voie', t => {
  const rawRecord = '5400840020FALL DES ACACIAS                N  3  0          00000000000000 00000001987001               001151   ACACIAS'
  t.deepEqual(parseVoie(rawRecord), {
    type: 'voie',
    annee_ajout: '1987',
    cle_rivoli: 'F',
    code_commune: '54084',
    code_departement: '54',
    code_majic: '00115',
    code_nature_voie: 'ALL',
    code_rivoli: '0020',
    code_type_voie: '1',
    id: '54084-0020',
    libelle_voie: 'DES ACACIAS',
    libelle_voie_complet: 'ALLEE DES ACACIAS',
    mot_directeur: 'ACACIAS',
    nature_voie: 'ALLEE',
    type_voie: 'voie',
    voie_privee: false
  })
})
