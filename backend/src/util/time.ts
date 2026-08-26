/**
 * @param {number} time - in minutes
 */
export const getTimeDurationObject = (
  time: number,
): {
  hours?: number
  minutes: number
} => {
  if (time > 60) {
    return {
      hours: Math.floor(time / 60),
      minutes: time % 60,
    }
  }
  return { minutes: time }
}

/**
 * @param startDate
 * @param endDate
 * @returns duration in minutes
 */
export const durationInMinutesFromDates = (startDate: Date, endDate: Date): number => {
  const diff = endDate.getTime() - startDate.getTime()
  return Math.floor(diff / (1000 * 60))
}

/**
 * The moment a mail link stops working, written out for whoever reads the mail.
 *
 * A duration ("valid for 24 hours") is only true of a link that was just issued. A resend
 * hands out the deadline the change already had, so it can have less than a full window
 * left - and then a duration is a promise the link does not keep. A moment is true whenever
 * it is read.
 *
 * The zone is named, because the server's is not the reader's.
 */
export const printDateTime = (moment: Date, language: string): string => {
  // Spelled out field by field on purpose: `dateStyle`/`timeStyle` cannot be combined with
  // `timeZoneName` - Intl throws a RangeError for that. Rendered once in all ten languages
  // before this was written.
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }
  return new Intl.DateTimeFormat(resolveDateTimeLocale(language), options).format(moment)
}

/**
 * The language a date is actually written in - English wherever the asked-for one is not one
 * this runtime knows.
 *
 * ⚠️ Asked of Intl explicitly, NOT caught from the constructor. `Intl.DateTimeFormat` only
 * throws on a MALFORMED tag; a well-formed one it does not know - "xx" - it accepts and
 * quietly resolves to the locale of the MACHINE it runs on (measured: `xx` -> `en-US` here,
 * and it would be another language on another server). A try/catch would therefore date a
 * mail in whatever the mail server happens to be set to, instead of the English the rest of
 * the system falls back to. Same rule and same reason as `resolveLocale` in
 * `frontend/src/utils/numberFormat.js`.
 *
 * Exported only so a test can measure it: through `printDateTime` alone the guard cannot be
 * shown to work on a machine whose own default is already English.
 */
export const resolveDateTimeLocale = (language: string): string => {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(language).length > 0 ? language : 'en'
  } catch {
    // A malformed tag - the one case the constructor would have thrown on.
    return 'en'
  }
}

/**
 * @param duration in minutes
 */
export const printTimeDuration = (duration: number): string => {
  const time = getTimeDurationObject(duration)
  const result = time.minutes > 0 ? `${time.minutes} minutes` : ''
  if (time.hours) {
    return `${time.hours} hours` + (result !== '' ? ` and ${result}` : '')
  }
  if (result === '') {
    return '0 minutes'
  }
  return result
}
