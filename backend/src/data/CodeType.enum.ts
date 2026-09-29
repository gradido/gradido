// AI-GENERATED — not an architecture reference

/**
 * What a sealed code is for, carried in a byte of its own inside the sealed block - the byte
 * that would otherwise be the most significant one of the expiry. Starts at 1: that byte of any
 * valid expiry is 0 (for the next 2.28 billion years), so a type is never mistaken for part of
 * an expiry, and a block that holds a bare expiry is no code of any type.
 */
export enum CodeType {
  PRESENCE = 1,
}
