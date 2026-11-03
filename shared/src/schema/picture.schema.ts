import * as v from 'valibot'

/** The earliest picture date taken from another community. */
export const TRANSFER_AVATAR_DATE_EARLIEST = new Date('2020-01-01T00:00:00.000Z')
/** How far a picture date may lie ahead of this server's clock: the other clock may run fast. */
export const TRANSFER_AVATAR_DATE_MAX_AHEAD_MS = 24 * 60 * 60 * 1000

export const avatarDateSchema = v.pipe(
  v.union([v.date(), v.string()]),
  v.check((value) => {
    let time: number
    if (typeof value === 'string') {
      time = Date.parse(value)
    } else {
      time = value.getTime()
    }
    return (
      !Number.isNaN(time) &&
      time >= TRANSFER_AVATAR_DATE_EARLIEST.getTime() &&
      time <= Date.now() + TRANSFER_AVATAR_DATE_MAX_AHEAD_MS &&
      new Date(time).toISOString() === value
    )
  }),
  v.transform((value) => new Date(value)),
)
