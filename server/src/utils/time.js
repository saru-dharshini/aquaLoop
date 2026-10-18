/**
 * Time utility anchored to Indian Standard Time (Asia/Kolkata, UTC+05:30)
 * Uses native Intl.DateTimeFormat (zero external dependencies).
 */

const TIMEZONE = 'Asia/Kolkata'

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Kolkata.
 * @param {Date} [date=new Date()]
 * @returns {string} e.g. "2026-10-18"
 */
export function getTodayIST(date = new Date()) {
  return getDateIST(date)
}

/**
 * Converts any Date object to a YYYY-MM-DD string in Asia/Kolkata.
 * @param {Date} date
 * @returns {string}
 */
export function getDateIST(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}

/**
 * Computes difference in calendar days between two YYYY-MM-DD strings.
 * @param {string} dateStr1 e.g. "2026-10-18"
 * @param {string} dateStr2 e.g. "2026-10-17"
 * @returns {number} positive if dateStr1 is after dateStr2
 */
export function daysBetweenIST(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return Infinity
  const d1 = new Date(`${dateStr1}T00:00:00.000+05:30`)
  const d2 = new Date(`${dateStr2}T00:00:00.000+05:30`)
  const diffMs = d1.getTime() - d2.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}
