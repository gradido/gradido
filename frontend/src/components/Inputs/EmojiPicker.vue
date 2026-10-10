<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div ref="root" class="emoji-picker" :class="{ 'is-corner': corner }" data-test="emoji-picker">
    <!-- The smiley beside a text field (Bernd, 10.10.2026): it opens the wallet's own small choice
         of emoji, and a press on one puts it into the field where the caret stands. A sign
         without a word, as the paperclip is: the smiley is learnt, and its name says the rest.

         A disclosure, as the paperclip's menu: the button says whether the choice is shown
         (`aria-expanded`) and which it is (`aria-controls`).

         `@mousedown.prevent`: a click takes no focus for the smiley -- the caret belongs in the
         field, where it shows the place the emoji will go to. The keyboard reaches the button
         by Tab. -->
    <button
      type="button"
      class="emoji-picker-toggle"
      :class="{ 'is-open': open }"
      :aria-label="t('emoji.insert')"
      :title="t('emoji.insert')"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? panelId : undefined"
      data-test="emoji-picker-toggle"
      @mousedown.prevent
      @click="toggleByPress"
    >
      <i-mdi-emoticon-happy-outline class="emoji-picker-toggle-icon" aria-hidden="true" />
    </button>
    <!-- The choice: drawn as the paperclip's menu is, on the menus' own grey. It stays open while
         emoji are chosen -- three in a row are three presses -- and while the field is typed in;
         it closes on Esc, on a press anywhere else, and behind a focus that goes elsewhere.

         It hangs over the page, placed by `place` -- not in the flow, where opening and closing
         it would move what stands under it, and not from an ancestor, whose edge could cut it
         off. Until it is placed it has its size and is not seen.

         ⛔ `@mousedown.prevent` on all of it: a press on a part that takes no focus -- the space
         between two emoji, the line under them -- would hand the focus to the nearest ancestor
         that does, the window, and the choice would close behind it under the pointer (measured
         at the paperclip's menu, P7c). -->
    <div
      v-if="open"
      :id="panelId"
      ref="panel"
      class="emoji-picker-panel"
      :style="spot ? { left: `${spot.left}px`, top: `${spot.top}px` } : UNPLACED"
      data-test="emoji-picker-panel"
      @mousedown.prevent
      @pointerleave="place"
    >
      <!-- A grid for the keys and for the ear: one stop for Tab, the arrows move in it, and a
           screen reader says the row and the column. An emoji needs no name of the wallet's: the
           sign is its name, and every screen reader says it in its own language. -->
      <div
        role="grid"
        class="emoji-picker-grid"
        :aria-label="t('emoji.choice')"
        data-test="emoji-picker-grid"
        @keydown="moveInGrid"
      >
        <div v-for="(row, r) in EMOJI_ROWS" :key="r" role="row" class="emoji-picker-row">
          <span v-for="(emoji, c) in row" :key="emoji" role="gridcell" class="emoji-picker-cell">
            <button
              type="button"
              class="emoji-picker-emoji"
              :tabindex="r === at.row && c === at.column ? 0 : -1"
              :data-row="r"
              :data-column="c"
              data-test="emoji-picker-emoji"
              @click="pick(emoji, $event)"
              @focus="at = { row: r, column: c }"
            >
              {{ emoji }}
            </button>
          </span>
        </div>
      </div>
      <!-- Where all the others are: the keys that open the device's own emoji, where the wallet
           knows them. -->
      <p v-if="moreWords" class="emoji-picker-more" data-test="emoji-picker-more">
        {{ moreWords }}
      </p>
      <!-- For the ear: a press on an emoji changes nothing a screen reader would say by itself.
           In the page as long as the choice is, so that what is written into it is announced. -->
      <p class="visually-hidden" role="status" data-test="emoji-picker-status">{{ said }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { EMOJI_ROWS, emojiKeysOf } from '@/utils/emojiChoice'
import { insertAtCaret } from '@/utils/insertAtCaret'

/**
 * The smiley and the wallet's own choice of emoji, for one text field (Bernd, 10.10.2026).
 *
 * It belongs to a field as a label does, by the field's id, and writes into it as a keyboard
 * would (utils/insertAtCaret): whoever holds the field hears its `input` and needs to know nothing
 * of the choice. Whether the smiley stands at all is asked by the place that has it
 * (`offersEmojiPicker`: at a computer only).
 */
const props = defineProps({
  /** The id of the text field the emoji go into. */
  fieldId: { type: String, required: true },
  /**
   * The smiley stands in the upper right corner of the nearest positioned ancestor, out of the
   * flow -- for a form, whose field has a label line with room at its end. Without it the smiley
   * is a part of the row it is put into.
   */
  corner: { type: Boolean, default: false },
})

const { t } = useI18n()

const id = useId()
const panelId = `${id}-emoji-panel`
const root = ref(null)
const panel = ref(null)
const open = ref(false)
/** Where the choice hangs, in the screen's own pixels; null until it is placed. */
const spot = ref(null)
/** The emoji the keyboard stands on -- the grid's one stop for Tab. Kept while the choice is shut. */
const at = ref({ row: 0, column: 0 })
/** What the status says for the ear. */
const said = ref('')

const fieldOf = () => document.getElementById(props.fieldId)

/** The line under the emoji. Written-out keys, for the i18n lint. */
const moreWords = computed(() => {
  const keys = emojiKeysOf()
  if (keys === 'mac') return t('emoji.moreOnMac')
  if (keys === 'windows') return t('emoji.moreOnWindows')
  return ''
})

/** The choice before it is placed: in the page, so that it has a size, and not seen. */
const UNPLACED = { left: '0px', top: '0px', visibility: 'hidden' }
/** Between the choice and what it hangs from, in pixels -- the gap of the paperclip's menu. */
const GAP = 6
/** What the choice keeps clear of the screen's edges, in pixels. */
const EDGE = 8

/**
 * Places the choice over the page: over what the smiley is put into -- the bar of a chat, what
 * wraps a form's field (the nearest positioned ancestor) -- at its right end; under it where
 * there is no room above and there is below; and where there is room on neither side, at the
 * edge of the screen on the side where it covers less of what it hangs from. Never out of the
 * screen.
 *
 * ⛔ In the screen's own pixels (`position: fixed`), not from an ancestor: a small window cuts off
 * what hangs out of it (the profile window of the map, with a profile that says little, has no
 * room for it over the bar nor under it), and in the flow of a form the choice moved what stood
 * under it -- a press on "Jetzt prüfen" closed it, and the button had moved from under the pointer
 * before it came up.
 *
 * Asked when the choice opens, when the page or the window moves (`follow`), and when the pointer
 * leaves the choice -- never while the pointer is on it: a field that grows with its emoji must
 * not move the emoji from under the pointer that is pressing them.
 */
const place = () => {
  const card = panel.value
  const hold = root.value?.offsetParent ?? root.value
  if (!card || !hold) return
  const anchor = hold.getBoundingClientRect()
  const { width, height } = card.getBoundingClientRect()
  const screen = { width: document.documentElement.clientWidth, height: window.innerHeight }
  const above = anchor.top - GAP - height
  const below = anchor.bottom + GAP
  const lowest = screen.height - EDGE - height
  let top = above
  if (above < EDGE) {
    if (below <= lowest) top = below
    else top = EDGE - above <= below - lowest ? EDGE : Math.max(EDGE, lowest)
  }
  const left = Math.max(EDGE, Math.min(anchor.right - width, screen.width - EDGE - width))
  spot.value = { left, top }
}

/**
 * The page or the window moved: the choice follows what it hangs from -- once the pointer is off
 * it. A field that grows in a window whose thread gives way moves that thread, and the thread
 * says so like any scrolling (measured: every other line the field grew, the choice went up a
 * line under the pointer). It follows when the pointer leaves.
 */
const follow = () => {
  if (!panel.value?.matches(':hover')) place()
}

const focusEmoji = ({ row, column }) =>
  root.value
    ?.querySelector(`[data-row="${row}"][data-column="${column}"]`)
    ?.focus({ preventScroll: true })

/** Ours: the smiley, the choice, and the field the emoji go into. */
const isOurs = (element) => Boolean(root.value?.contains(element)) || element === fieldOf()

const closeUnlessOurs = (event) => {
  if (!isOurs(event.target)) close()
}

/**
 * ⛔ Esc closes the choice and nothing more, wherever the focus is: caught before it reaches the
 * field -- whose own Esc lets go of a message being changed -- and before it reaches the contact
 * window, whose dialog closes on an Esc from anywhere inside it. With the choice shut, Esc goes
 * on as always.
 */
const closeByKey = (event) => {
  if (event.key !== 'Escape') return
  event.stopPropagation()
  event.preventDefault()
  close({ byKey: true })
}

const listen = () => {
  document.addEventListener('keydown', closeByKey, true)
  document.addEventListener('pointerdown', closeUnlessOurs, true)
  document.addEventListener('focusin', closeUnlessOurs)
  // Whatever moves what the choice hangs from: the page, a window's body, the browser's window.
  document.addEventListener('scroll', follow, true)
  window.addEventListener('resize', follow)
}

const stopListening = () => {
  document.removeEventListener('keydown', closeByKey, true)
  document.removeEventListener('pointerdown', closeUnlessOurs, true)
  document.removeEventListener('focusin', closeUnlessOurs)
  document.removeEventListener('scroll', follow, true)
  window.removeEventListener('resize', follow)
}
onBeforeUnmount(stopListening)

/**
 * Shuts the choice. The emoji the keyboard stood on goes with it, and a focus left on nothing
 * would take the window's own keys along -- its Esc, the place Tab goes on from: the focus goes
 * into the field. After Esc also where it was on nothing before (a menu that closed under it).
 * A focus that stands elsewhere -- on the smiley, in the field -- is left alone.
 */
const close = ({ byKey = false } = {}) => {
  if (!open.value) return
  const active = document.activeElement
  const nowhere = !active || active === document.body
  const toField = Boolean(panel.value?.contains(active)) || (byKey && nowhere)
  open.value = false
  spot.value = null
  said.value = ''
  stopListening()
  if (toField) fieldOf()?.focus({ preventScroll: true })
}

/**
 * For whoever sends what is in the field: the choice goes with the message (ChatComposeBar). An
 * emoji pressed while the message is on its way would stay behind with the words that went out.
 */
defineExpose({ close })

/**
 * The smiley was pressed. Opened by the keyboard -- a click without a pointer, `detail` 0 -- the
 * focus goes into the choice, to the emoji it stood on last. Opened by a click, it goes into the
 * field: the caret shows where the emoji will go, and the keys the line under the emoji names
 * have a field to write into.
 */
const toggleByPress = async (event) => {
  if (open.value) {
    close()
    return
  }
  open.value = true
  listen()
  await nextTick()
  place()
  if (event.detail !== 0) {
    const field = fieldOf()
    if (field && document.activeElement !== field) field.focus({ preventScroll: true })
    return
  }
  await nextTick()
  focusEmoji(at.value)
}

/**
 * An emoji was pressed: it goes into the field, and the choice stays for the next one. Chosen by
 * the keyboard, the focus comes back to the emoji -- the insertion took it into the field -- and
 * the choice follows a field that grew; under a pointer it stays where it is (see `place`).
 */
const pick = async (emoji, event) => {
  const byKey = event.detail === 0
  const pressed = event.currentTarget
  if (!insertAtCaret(fieldOf(), emoji)) return
  if (byKey) pressed.focus({ preventScroll: true })
  // Emptied first: the same emoji twice is the same words twice, and would be said once.
  said.value = ''
  await nextTick()
  if (!open.value) return
  said.value = t('emoji.inserted', { emoji })
  if (byKey) place()
}

const STEPS = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }

/**
 * The arrows move through the grid and stop at its edges -- beyond an edge there is no emoji to
 * go to, and the focus stays where it is; Home and End go to the ends of the row. With a modifier
 * they are the browser's own keys and are left alone.
 */
const moveInGrid = (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  const step = STEPS[event.key]
  let next = null
  if (step) next = { row: at.value.row + step[0], column: at.value.column + step[1] }
  else if (event.key === 'Home') next = { row: at.value.row, column: 0 }
  else if (event.key === 'End') next = { row: at.value.row, column: EMOJI_ROWS[0].length - 1 }
  if (!next) return
  // An arrow in a window would move what is behind the choice -- also one at the grid's edge.
  event.preventDefault()
  focusEmoji(next)
}
</script>

<style lang="scss" scoped>
/* In a row: only the smiley takes room -- the choice hangs over the page. */
.emoji-picker {
  display: flex;
  flex: 0 0 auto;
}

/* The smiley: drawn as the paperclip is -- the sign in the muted colour, nothing filled, a
   surface under it where a mouse rests on it and while its choice is open. A size smaller than
   the paperclip: it stands inside a field's rim, or at the end of a label's line. */
.emoji-picker-toggle {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--bs-secondary-color, #6c757d);
  cursor: pointer;
}

.emoji-picker-toggle.is-open {
  background: var(--surface-muted, #f2f4f6);
  color: var(--bs-body-color);
}

@media (hover: hover) {
  .emoji-picker-toggle:hover {
    background: var(--surface-muted, #f2f4f6);
    color: var(--bs-body-color);
  }
}

.emoji-picker-toggle:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.emoji-picker-toggle-icon {
  width: 1.35rem;
  height: 1.35rem;
}

/* The choice: the paperclip's menu (ChatComposeBar) -- a small card with a shadow on the menus'
   own grey. Over the page, where `place` puts it: over everything of the page it is on, a
   sticky bar too, and inside a window over all of that window.

   As wide as its emoji (`max-content`), and never wider than the screen. ⚠️ Not left to "as wide
   as there is room": what hangs over the page is given the room from where it stands to the
   screen's right edge, and near that edge the columns -- which may give way -- gave way (measured
   at 500 px: emoji of 27 px in place of 36). */
.emoji-picker-panel {
  position: fixed;
  z-index: 1040;
  width: max-content;
  max-width: calc(100vw - 1rem);
  padding: 0.35rem;
  border: 1px solid var(--menu-border, #b3bac2);
  border-radius: 0.85rem;
  background: var(--menu-surface, #dde1e6);
  box-shadow: 0 8px 28px rgb(0 0 0 / 22%);
}

/* Eight in a row (EMOJI_ROWS), each a square of 36 px -- and narrower where the screen is: the
   columns give way, the choice never hangs out of it. */
.emoji-picker-row {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 2.25rem));
}

.emoji-picker-cell {
  display: block;
}

/* The device's own coloured drawing, asked for by name: left to the page's font, a sign that is
   also a letter of some font (the heart, the sun) could come out black and flat. */
.emoji-picker-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

@media (hover: hover) {
  .emoji-picker-emoji:hover {
    background: var(--menu-hover, #eef0f3);
  }
}

.emoji-picker-emoji:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: -2px;
}

/* The line under the emoji is as wide as the emoji are, and breaks where it must: it asks for no
   width of its own (`width: 0`) and then takes what the grid made the card (`min-width`). Left
   to itself, a long line -- the Greek one -- would make the card wider than its emoji. */
.emoji-picker-more {
  width: 0;
  min-width: 100%;
  margin: 0;
  padding: 0.3rem 0.35rem 0.15rem;
  color: var(--menu-text-muted, #4d555d);
  font-size: 0.8rem;
  line-height: 1.3;
}

/* In a form: the smiley at the end of the label's line -- the upper right corner of what the
   form wraps the field in. It takes no room there. */
.emoji-picker.is-corner {
  display: block;
}

.emoji-picker.is-corner .emoji-picker-toggle {
  position: absolute;
  top: -0.25rem;
  right: 0;
}
</style>
