const test = require('ava')
const {parseDate} = require('../lib/parse/util')

test('parseDate', t => {
  t.is(parseDate('2018070'), '2018-03-11')
})
