// AI-GENERATED — not an architecture reference

/**
 * The reader's place in a scrolling thread, kept while its lines reflow (E-077: the chat window
 * made large, or small again). A box left at the same number of pixels shows another part of the
 * conversation once its width has changed, so the place is named by what stands at the box's top
 * edge: the item, and how far into it the edge stands -- as a share of the item's height. An item
 * that gets wider gets lower by about the same measure all the way down, so a long message read
 * half-way is still read half-way. Where the edge stands in the room before an item (a day's
 * date, the gap between two bubbles), that room is kept in pixels: it does not reflow.
 */

/**
 * What stands at the top edge of the box.
 *
 * @param {Element} box the scrolling box
 * @param {Iterable<HTMLElement>} items the thread's items in the order they stand, each with its
 * key (`data-key`)
 * @returns {{ key: string, into: number, before: number } | null} the first item that reaches
 * below the edge: `into` is the share of it above the edge, `before` the pixels between the edge
 * and an item that begins below it. Null where no item reaches below the edge.
 */
export const chatReadingPlace = (box, items) => {
  const edge = box.getBoundingClientRect().top
  for (const item of items) {
    const { top, height } = item.getBoundingClientRect()
    if (top + height <= edge) continue
    return {
      key: item.dataset.key,
      // An item that reaches below the edge from above it has a height: nothing divides by zero.
      into: top < edge ? (edge - top) / height : 0,
      before: Math.max(0, top - edge),
    }
  }
  return null
}

/**
 * How far the box has to scroll for a place to stand at its top edge again -- read after the
 * lines have reflowed, with the item as it lies now.
 *
 * @param {Element} box the scrolling box
 * @param {Element} item the item the place names
 * @param {{ into: number, before: number }} place as `chatReadingPlace` gave it
 * @returns {number} pixels to add to the box's `scrollTop`; negative to scroll up
 */
export const chatReadingPlaceOffset = (box, item, place) => {
  const { top, height } = item.getBoundingClientRect()
  return top + place.into * height - place.before - box.getBoundingClientRect().top
}
