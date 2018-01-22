const {join} = require('path')
const test = require('ava')
const {createDatabase} = require('../')

const FANTOIR_90_PATH = join(__dirname, 'fixtures', 'FANTOIR_90.gz')

test('create database from real file', async t => {
  const fantoir = await createDatabase(FANTOIR_90_PATH)
  t.is(fantoir.size, 10743)
})

test('create database from real file without options', async t => {
  const fantoir = await createDatabase(FANTOIR_90_PATH)
  t.throws(() => fantoir.search('toto'), 'Database not searchable')
})

test('create searchable database from real file', async t => {
  const fantoir = await createDatabase(FANTOIR_90_PATH, {searchable: true})
  t.notThrows(() => fantoir.search('toto'))
})
