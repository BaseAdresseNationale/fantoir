const test = require('ava')
const {InMemoryDatabase} = require('../lib/db/in-memory')

const records = [
  {
    id: '12345-1234',
    codeCommune: '12345',
    libelleVoieComplet: 'ALL D HONNEUR'
  },
  {
    id: '12345-6789',
    codeCommune: '12345',
    libelleVoieComplet: 'RUE REPUBLIQUE'
  },
  {
    id: '23456-1234',
    codeCommune: '23456',
    libelleVoieComplet: 'RUE REPUBLIQUE'
  }
]

test('database creation', t => {
  const fantoir = new InMemoryDatabase(records)
  t.is(fantoir.size, 3)
  t.throws(() => fantoir.search('toto'), 'Database not searchable')
})

test('searchable database creation', t => {
  const fantoir = new InMemoryDatabase(records, {searchable: true})
  t.is(fantoir.size, 3)
  t.deepEqual(fantoir.records, records)
  t.notThrows(() => fantoir.search('toto'), 'Database not searchable')
})

test('get by id', t => {
  const fantoir = new InMemoryDatabase(records)
  t.is(fantoir.get('12345-1234').libelleVoieComplet, 'ALL D HONNEUR')
})

test('commune subset', t => {
  const fantoir = new InMemoryDatabase(records, {searchable: true})
  const commune = fantoir.commune('12345')
  t.is(commune.size, 2)
  t.notThrows(() => commune.search('toto'), 'Database not searchable')
})

test('custom subset', t => {
  const fantoir = new InMemoryDatabase(records, {searchable: true})
  const subset = fantoir.subset(r => r.codeCommune === '23456')
  t.is(subset.size, 1)
  t.throws(() => subset.search('toto'), 'Database not searchable')
})

test('records', t => {
  const fantoir = new InMemoryDatabase(records)
  t.deepEqual(fantoir.records, records)
})

test('search', t => {
  const fantoir = new InMemoryDatabase(records, {searchable: true})
  const result = fantoir.search('r republiq')
  t.is(result.length, 2)
  result.forEach(r => {
    t.is(r.libelleVoieComplet, 'RUE REPUBLIQUE')
    t.true(r.score >= 0.5)
    t.true(r.score <= 1)
  })
  t.deepEqual(result.map(r => r.id), ['12345-6789', '23456-1234'])
})
