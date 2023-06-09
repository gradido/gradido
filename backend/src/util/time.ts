export const getTimeDurationObject = (time: number): { hours?: number; minutes: number } => {
  if (time > 60) {
    return {
      hours: Math.floor(time / 60),
      minutes: time % 60,
    }
  }
  return { minutes: time }
}

export const printTimeDuration = (duration: number): string => {
  const time = getTimeDurationObject(duration)
  const result = time.minutes > 0 ? `${time.minutes} minutes` : ''
  if (time.hours) return `${time.hours} hours` + (result !== '' ? ` and ${result}` : '')
  return result
}
