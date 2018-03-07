#!/usr/bin/env node --max_old_space_size=2048
/* eslint unicorn/no-process-exit: off */
const {join, resolve} = require('path')
const {createWriteStream} = require('fs')
const {createGzip} = require('zlib')
const {promisify} = require('util')
const {PassThrough} = require('stream')
const decompress = require('decompress')
const splitBuffer = require('split-buffer')
const split = require('split2')
const {each, pipeline, through, finished} = require('mississippi')

const finishedAsync = promisify(finished)

const argv = require('minimist')(process.argv.slice(2))

if (!argv.src || !argv.dest) {
  boom('--src et --dest sont des paramètres obligatoires !')
}

const srcPath = resolve(argv.src)
const destPath = resolve(argv.dest)

let currentDepCode
let currentDepWriteStream
const waitForClose = []

function getDepartementCode(line) {
  if (line.startsWith('99') || !line.charAt(0).match(/\d/)) return
  if (line.startsWith('97')) return line.substr(0, 3)
  return line.substr(0, 2)
}

function eachLine(line, next) {
  const depCode = getDepartementCode(line)
  if (!depCode) return next()
  if (depCode !== currentDepCode) {
    if (currentDepWriteStream) {
      currentDepWriteStream.end()
    }
    currentDepWriteStream = createDepartementWriteStream(join(destPath, depCode + '.gz'))
    currentDepCode = depCode
    waitForClose.push(finishedAsync(currentDepWriteStream))
  }
  currentDepWriteStream.write(line, next)
}

async function doStuff() {
  const [file] = await decompress(srcPath)
  const fantoirStream = bufferToStream(file.data)
  const stream = pipeline.obj(fantoirStream, split())

  await new Promise((resolve, reject) => {
    each(stream, eachLine, err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })

  await Promise.all(waitForClose)
}

doStuff().catch(boom)

/* Helpers */

function lineConcat(separator = '\r\n') {
  return through.obj((line, enc, cb) => {
    cb(null, line + separator)
  })
}

function createDepartementWriteStream(path) {
  const file = createWriteStream(path)
  return pipeline.obj(lineConcat(), createGzip(), file)
}

function bufferToStream(buffer) {
  const stream = new PassThrough()
  splitBuffer(buffer, 4096).forEach(b => stream.push(b))
  stream.push(null)
  return stream
}

function boom(err) {
  console.error(err)
  process.exit()
}

/* Execution */
