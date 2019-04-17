#!/usr/bin/env node
const {promisify} = require('util')
const split = require('split2')
const {createGunzip} = require('gunzip-stream')
const {through} = require('mississippi')
const Keyv = require('keyv')

const pipe = promisify(require('mississippi').pipe)

const keyv = new Keyv('sqlite://fantoir.sqlite')

let currentCodeCommune
let currentContent = []

function getCodeCommune(line) {
  if (line.startsWith('99') || !line.charAt(0).match(/\d/) || !line.substr(3, 3).match(/\d{3}/)) {
    return
  }

  return line.substr(0, 2) + line.substr(3, 3)
}

async function eachLine(line, enc, next) {
  const codeCommune = getCodeCommune(line)
  if (!codeCommune) {
    return next()
  }

  if (codeCommune !== currentCodeCommune) {
    if (currentContent) {
      await keyv.set(currentCodeCommune, currentContent.join('\n'))
      currentContent = []
    }

    currentCodeCommune = codeCommune
    console.log(codeCommune)
  }

  currentContent.push(line)
  next()
}

async function main() {
  await keyv.clear()
  await pipe(
    process.stdin,
    createGunzip(),
    split(),
    through.obj(eachLine)
  )
}

main().catch(error => {
  console.error(error)
  process.exit()
})
