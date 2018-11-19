function cleanLabel(label) {
  return label.replace(/\W+/g, '')
}

function compareLabelsStrict(labelA, labelB) {
  return cleanLabel(labelA) === cleanLabel(labelB)
}

module.exports = {
  cleanLabel,
  compareLabelsStrict
}
