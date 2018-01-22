const test = require('ava')
const intoStream = require('into-stream')
const getStream = require('get-stream')
const {parseStream} = require('../lib/parse/stream')

test('parse input stream', async t => {
  const input = intoStream([
    '540084    YMONT-BONVILLERS                N  3      000108100000000000000 00000001987001',
    '5400840020FALL DES ACACIAS                N  3  0          00000000000000 00000001987001               001151   ACACIAS'
  ].join('\n'))
  const records = await getStream.array(input.pipe(parseStream()))
  t.is(records.length, 1)
  t.is(records[0].id, '54084-0020')
})
