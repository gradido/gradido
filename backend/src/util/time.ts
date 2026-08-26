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
  // `timeZoneName` - Intl throws a RangeError for that, and it would throw in the fallback
  // below just the same. Rendered once in all ten languages before this was written.
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }
  try {
    return new Intl.DateTimeFormat(language, options).format(moment)
  } catch {
    // A tag Intl cannot read must not cost somebody their mail.
    return new Intl.DateTimeFormat('en', options).format(moment)
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
