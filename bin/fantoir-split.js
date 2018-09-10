#!/usr/bin/env node
/* eslint unicorn/no-process-exit: off */
const {join, resolve} = require('path')
const {createWriteStream} = require('fs')
const {createGzip} = require('zlib')
const {promisify} = require('util')
const split = require('split2')
const {createGunzip} = require('gunzip-stream')
const {each, pipeline, through, finished} = require('mississippi')

const finishedAsync = promisify(finished)

const argv = require('minimist')(process.argv.slice(2))

if (!argv.dest) {
  boom('--dest est un paramètre obligatoire !')
}

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
    waitForClose.push(wrapDepartementWriter(depCode, currentDepWriteStream))
  }
  currentDepWriteStream.write(line, next)
}

async function doStuff() {
  const stream = pipeline.obj(
    process.stdin,
    createGunzip(),
    split())

  await new Promise((resolve, reject) => {
    each(stream, eachLine, err => {
      if (err) {
        return reject(err)
      }
      currentDepWriteStream.end()
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

async function wrapDepartementWriter(depCode, writable) {
  await finishedAsync(writable)
  console.log('Finished writing ' + depCode)
}

function boom(err) {
  console.error(err)
  process.exit()
}

/* Execution */
