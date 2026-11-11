// AI-GENERATED — not an architecture reference

/**
 * Whether this version is older than the server's: raised once, never lowered -- a reload is the
 * reset. Not kept in localStorage on purpose: a flag that outlived the reload it asks for would
 * keep the bar for good.
 */
export const appOutdated = { value: false }

export const markAppOutdated = () => {
  appOutdated.value = true
}
