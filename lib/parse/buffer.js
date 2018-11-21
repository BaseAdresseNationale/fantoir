const {bufferToStream} = require('./util')
const {streamToRecords} = require('./stream')

function parseBuffer(buffer) {
  return streamToRecords(bufferToStream(buffer))
}

module.exports = {parseBuffer}
