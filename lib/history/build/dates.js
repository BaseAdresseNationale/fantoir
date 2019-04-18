const ONE_MONTH = 30

function datesNearlyEquals(date1, date2) {
  const distance = Math.abs(date1 - date2)
  return distance < ONE_MONTH
}

module.exports = {datesNearlyEquals}
