const ONE_MONTH = 30 * 24 * 3600 * 1000

function datesNearlyEquals(dateStr1, dateStr2) {
  const distance = Math.abs((new Date(dateStr1)).getTime() - (new Date(dateStr2)).getTime())
  return distance < ONE_MONTH
}

module.exports = {datesNearlyEquals}
