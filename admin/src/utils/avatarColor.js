// AI-GENERATED — not an architecture reference

/**
 * The colour of an avatar that shows initials instead of a picture.
 *
 * This lived inside AppAvatar.vue until the printed member card needed the same colour on
 * paper, and a canvas cannot ask a Vue component. So the rule moved here and the component
 * reads it from this file: one rule, two renderers, no chance for them to drift.
 *
 * That drift is not hypothetical. The printed thank-you cheque paints its initials disc in
 * a fixed blue-grey of its own, so the same member is one colour in the wallet and another
 * on the cheque. Nobody noticed while the cheque was the only printed thing; the card would
 * have made it visible. Bringing the cheque here is a separate change.
 */

// Enhanced color palette with better contrast ratios
export const AVATAR_COLOR_PALETTE = [
  { bg: '#4A5568', text: '#FFFFFF' }, // Slate Blue
  { bg: '#2C7A7B', text: '#FFFFFF' }, // Teal
  { bg: '#805AD5', text: '#FFFFFF' }, // Purple
  { bg: '#DD6B20', text: '#FFFFFF' }, // Orange
  { bg: '#3182CE', text: '#FFFFFF' }, // Blue
  { bg: '#38A169', text: '#FFFFFF' }, // Green
  { bg: '#E53E3E', text: '#FFFFFF' }, // Red
  { bg: '#6B46C1', text: '#FFFFFF' }, // Indigo
  { bg: '#2B6CB0', text: '#FFFFFF' }, // Dark Blue
  { bg: '#9C4221', text: '#FFFFFF' }, // Brown
]

// Generate consistent index based on string
const stringToIndex = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash % AVATAR_COLOR_PALETTE.length)
}

/**
 * The palette entry a seed maps to. The seed is the initials where they exist and the name
 * otherwise -- the same order AppAvatar has always used, kept so that no member's colour
 * changes because this moved into a file of its own.
 *
 * @param {string} seed
 * @returns {{bg: string, text: string}}
 */
export const avatarPaletteEntry = (seed) => AVATAR_COLOR_PALETTE[stringToIndex(String(seed ?? ''))]
