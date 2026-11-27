// AI-GENERATED — not an architecture reference

/**
 * What a guarantor code in the address of the registration is worth at `now` (ms): a member
 * vouches for the account while it runs (`active`), did so until it ran out (`expired`), or
 * it is no such code (`none`). Its first part is the second it ends at; the seal after the
 * point is the server's to check.
 */
export function guarantorCodeState(code: unknown, now: number) {
  if (typeof code !== 'string' || !/^\d+\.[A-Za-z0-9_-]+$/.test(code)) {
    return 'none'
  }
  return Number(code.split('.')[0]) * 1000 > now ? 'active' : 'expired'
}
