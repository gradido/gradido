<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="chat-reaction-choice" :class="{ 'is-busy': busy }" data-test="chat-reaction-choice">
    <!-- The reactions a press away (Bernd, 11.10.2026): his six in a row, and "mehr" behind them
         for all forty-eight. One reaction a member and message, so the row is a choice of one:
         the member's own is the pressed one, and a press on it takes it back.

         For the ear a button is its emoji, which says its own name, and whether it is pressed --
         in the group "Reagieren". Not a sentence as its name: "Mit Rotes Herz reagieren" is
         heard with the name in the wrong case in every language that has cases, seven times in
         a row, and a name that changes with the state ("zurücknehmen", pressed) contradicts it.
         The sentence is the pointer's (`title`).

         One stop for Tab, the arrows move in it -- seven stops in front of the menu's entries
         would stand between the keyboard and "Antworten". A toolbar says so to a screen reader:
         in a plain group nothing tells that the arrows lead on.

         While a reaction to the message is on its way (`busy`), no emoji takes a press -- and
         shows it: read off a state that is about to change, a second press would set what was
         meant to be taken back. The buttons stay where the keyboard can stand on them.

         Kept by their place, not by their emoji: the last of the six gives way to an own
         reaction from behind "mehr", and a button that is replaced loses the keyboard. -->
    <div
      v-if="!all"
      ref="row"
      role="toolbar"
      class="chat-reaction-choice-row"
      :aria-label="t('chatThread.react')"
      :aria-busy="busy ? 'true' : undefined"
      data-test="chat-reaction-row"
      @keydown="moveInRow"
    >
      <button
        v-for="(emoji, index) in shown"
        :key="index"
        type="button"
        class="chat-reaction-choice-emoji"
        :class="{ 'is-own': emoji === own }"
        :tabindex="index === rowAt ? 0 : -1"
        :aria-pressed="emoji === own ? 'true' : 'false'"
        :aria-disabled="busy ? 'true' : undefined"
        :title="hintOf(emoji)"
        :data-index="index"
        data-test="chat-reaction-quick"
        @click="press(emoji)"
        @focus="rowAt = index"
      >
        {{ emoji }}
      </button>
      <button
        type="button"
        class="chat-reaction-choice-more"
        :tabindex="rowAt === shown.length ? 0 : -1"
        :aria-label="t('chatThread.reactMore')"
        :title="t('chatThread.reactMore')"
        :data-index="shown.length"
        data-test="chat-reaction-more"
        @click="showAll"
        @focus="rowAt = shown.length"
      >
        <i-mdi-plus class="chat-reaction-choice-more-icon" aria-hidden="true" />
      </button>
    </div>
    <!-- All forty-eight, in the place of the row -- and of the menu's entries, which the menu
         takes away meanwhile (`all`): so the menu is no higher with them than without. The grid
         of the smiley's choice (EmojiPicker): one stop for Tab, the arrows move in it. -->
    <div
      v-else
      ref="grid"
      role="grid"
      class="chat-reaction-choice-grid"
      :aria-label="t('chatThread.react')"
      :aria-busy="busy ? 'true' : undefined"
      data-test="chat-reaction-grid"
      @keydown="moveInGrid"
    >
      <div v-for="(line, r) in EMOJI_ROWS" :key="r" role="row" class="chat-reaction-choice-line">
        <span v-for="(emoji, c) in line" :key="emoji" role="gridcell">
          <button
            type="button"
            class="chat-reaction-choice-emoji"
            :class="{ 'is-own': emoji === own }"
            :tabindex="r === gridAt.row && c === gridAt.column ? 0 : -1"
            :aria-pressed="emoji === own ? 'true' : 'false'"
            :aria-disabled="busy ? 'true' : undefined"
            :title="hintOf(emoji)"
            :data-row="r"
            :data-column="c"
            data-test="chat-reaction-emoji"
            @click="press(emoji)"
            @focus="gridAt = { row: r, column: c }"
          >
            {{ emoji }}
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHAT_QUICK_REACTIONS } from '@/utils/chatReactions'
import { EMOJI_ROWS } from '@/utils/emojiChoice'
import { emojiGridStep } from '@/utils/emojiGridKeys'

/**
 * The choice of a reaction (Bernd, 11.10.2026): six emoji a press away and, behind "mehr", all
 * forty-eight the wallet has (utils/emojiChoice). It only says which emoji was pressed (`react`);
 * what that means -- set, replace, take back -- whoever holds the message decides
 * (chatReactionToSend).
 */
const props = defineProps({
  /** The emoji the member has reacted with already, or null: it is shown pressed. */
  own: { type: String, default: null },
  /** A reaction of the member's to this message is on its way: no emoji takes a press. */
  busy: { type: Boolean, default: false },
})

/**
 * `react`: an emoji was pressed. `all`: the forty-eight are shown (true) -- for whoever draws
 * something beside the choice that is to make room for them.
 */
const emit = defineEmits(['react', 'all'])

const { t } = useI18n()

const row = ref(null)
const grid = ref(null)
const all = ref(false)
/**
 * The six of the row. Where the member's own reaction is none of them -- it was chosen behind
 * "mehr" --, it stands in the place of the last one: what is pressed is in sight, and a press
 * takes it back without a way through the forty-eight.
 */
const shown = computed(() =>
  props.own && !CHAT_QUICK_REACTIONS.includes(props.own)
    ? [...CHAT_QUICK_REACTIONS.slice(0, -1), props.own]
    : CHAT_QUICK_REACTIONS,
)

/**
 * Where the keyboard stands in the row -- its one stop for Tab; the last place is "mehr". On the
 * member's own reaction where there is one, as a choice of one has it: else on the first.
 */
const rowAt = ref(Math.max(0, shown.value.indexOf(props.own)))
/** Where it stands among the forty-eight. */
const gridAt = ref({ row: 0, column: 0 })

/** An emoji was pressed: said upwards -- not while a reaction is on its way. */
const press = (emoji) => {
  if (!props.busy) emit('react', emoji)
}

/** What a press on an emoji does, in words -- for the pointer that rests on it. */
const hintOf = (emoji) =>
  emoji === props.own
    ? t('chatThread.reactTakeBack', { emoji })
    : t('chatThread.reactWith', { emoji })

/** The arrows move along the row and stop at its ends; Home and End go to them. */
const moveInRow = (event) => {
  const next = emojiGridStep({ row: 0, column: rowAt.value }, event, shown.value.length + 1)
  if (!next) return
  event.preventDefault()
  if (next.row !== 0) return
  row.value?.querySelector(`[data-index="${next.column}"]`)?.focus({ preventScroll: true })
}

const focusInGrid = ({ row: r, column: c }) =>
  grid.value?.querySelector(`[data-row="${r}"][data-column="${c}"]`)?.focus({ preventScroll: true })

const moveInGrid = (event) => {
  const next = emojiGridStep(gridAt.value, event, EMOJI_ROWS[0].length)
  if (!next) return
  // An arrow in a window would move the thread behind the menu -- also one at the grid's edge.
  event.preventDefault()
  focusInGrid(next)
}

/**
 * "mehr": the forty-eight in the place of the row. The keyboard goes on to the member's own
 * reaction where it is among them, else to the first -- the button that was pressed is gone.
 */
const showAll = async () => {
  all.value = true
  emit('all', true)
  for (const [r, line] of EMOJI_ROWS.entries()) {
    const c = line.indexOf(props.own)
    if (c !== -1) gridAt.value = { row: r, column: c }
  }
  await nextTick()
  focusInGrid(gridAt.value)
}
</script>

<style lang="scss" scoped>
/* The row of six and "mehr": as wide as the menu, each an equal share of it and a finger high
   (2.75rem is 44 px). */
.chat-reaction-choice-row {
  display: flex;
  gap: 0.15rem;
}

/* The device's own coloured drawing, asked for by name (as EmojiPicker has it): left to the
   page's font, a sign that is also a letter of some font -- the heart -- could come out black
   and flat. */
.chat-reaction-choice-emoji,
.chat-reaction-choice-more {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 2.75rem;
  padding: 0;
  border: 0;
  border-radius: 0.6rem;
  background: transparent;
  color: var(--bs-body-color);
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

.chat-reaction-choice-more-icon {
  width: 1.4rem;
  height: 1.4rem;
  color: var(--menu-icon, #a8732a);
}

@media (hover: hover) {
  .chat-reaction-choice-emoji:hover,
  .chat-reaction-choice-more:hover {
    background: var(--menu-hover, #eef0f3);
  }
}

.chat-reaction-choice-emoji:focus-visible,
.chat-reaction-choice-more:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: -2px;
}

/* One's own reaction: the pressed one -- on the surface a pointer gives the others, with a rim
   in the gold of the menu's signs (`--menu-icon`): the plain gold came to 2.2 : 1 on the menu's
   grey in the light mode and to 2.6 in the dark one, this one is 3.1 and 4.0 (measured
   11.10.2026). */
.chat-reaction-choice-emoji.is-own {
  background: var(--menu-hover, #eef0f3);
  box-shadow: inset 0 0 0 2px var(--menu-icon, #a8732a);
}

/* With the keyboard on it -- where it comes in, and where "mehr" puts it -- the rim moves in
   by the keyboard's own ring, which is drawn where the rim was: both are seen, the green one
   outside and the gold one inside it (measured 11.10.2026: the ring alone had covered the rim). */
.chat-reaction-choice-emoji.is-own:focus-visible {
  box-shadow: inset 0 0 0 4px var(--menu-icon, #a8732a);
}

/* All forty-eight: eight in a row (EMOJI_ROWS), each a square of 36 px -- and narrower where the
   menu is: the columns give way, as in the smiley's choice. */
.chat-reaction-choice-line {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 2.25rem));
}

.chat-reaction-choice-grid .chat-reaction-choice-emoji {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  border-radius: 0.5rem;
}

/* A reaction is on its way: the emoji stand back until it is there. */
.chat-reaction-choice.is-busy .chat-reaction-choice-emoji {
  opacity: 0.45;
  cursor: progress;
}

/* Under a finger -- no pointer that hovers -- the squares are up to 44 px where the menu has the
   room (ChatMessageMenu): they stand edge to edge, and a miss sets a reaction everybody in the
   conversation sees. The smiley's choice, whose measure the 36 px are, is a computer's alone. */
@media (hover: none) {
  .chat-reaction-choice-line {
    grid-template-columns: repeat(8, minmax(0, 2.75rem));
  }
}
</style>
