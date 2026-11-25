// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** An amount as the server sends it -- a decimal as text, to lose no digit on the way -- as a number. */
export const gddSchema = v.pipe(v.string(), v.decimal(), v.transform(Number))
