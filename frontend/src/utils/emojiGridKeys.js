// AI-GENERATED — not an architecture reference

const STEPS = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }

/**
 * Where a key takes the keyboard in a grid of emoji that has one stop for Tab (EmojiPicker,
 * ChatReactionChoice): an arrow one step on, Home and End to the ends of the row. Null for every
 * other key -- and for any of these with a modifier: they are the browser's own keys then, and
 * are left alone.
 *
 * The place may lie beyond an edge of the grid: there is no emoji to go to there, and whoever
 * asks looks for one and leaves the focus where it is.
 *
 * @param {{ row: number, column: number }} at where the keyboard stands
 * @param {KeyboardEvent} event the key
 * @param {number} columns how many emoji a row has
 * @returns {{ row: number, column: number } | null}
 */
export const emojiGridStep = (at, event, columns) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return null
  const step = STEPS[event.key]
  if (step) return { row: at.row + step[0], column: at.column + step[1] }
  if (event.key === 'Home') return { row: at.row, column: 0 }
  if (event.key === 'End') return { row: at.row, column: columns - 1 }
  return null
}
