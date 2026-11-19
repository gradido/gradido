// AI-GENERATED — not an architecture reference
import { computed, defineComponent, nextTick, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHAT_QUICK_REACTIONS } from '@/utils/chatReactions'
import { EMOJI_ROWS } from '@/utils/emojiChoice'
import { emojiGridStep } from '@/utils/emojiGridKeys'
import IMdiPlus from '~icons/mdi/plus'
import classes from './ChatReactionChoice.module.scss'

/** A class by its name and in the module's spelling: the stylesheet's rules hang on the latter. */
const c = (name: string) => [name, classes[name]]

/**
 * The choice of a reaction (Bernd, 11.10.2026): six emoji a press away and, behind "mehr", all
 * forty-eight the wallet has (utils/emojiChoice). It only says which emoji was pressed (`react`);
 * what that means -- set, replace, take back -- whoever holds the message decides
 * (chatReactionToSend).
 */
export const ChatReactionChoice = defineComponent({
  name: 'ChatReactionChoice',
  props: {
    /** The emoji the member has reacted with already, or null: it is shown pressed. */
    own: { type: String as PropType<string | null>, default: null },
    /** A reaction of the member's to this message is on its way: no emoji takes a press. */
    busy: { type: Boolean, default: false },
  },
  /**
   * `react`: an emoji was pressed. `all`: the forty-eight are shown (true), or the row of six is
   * back (false) -- for whoever draws something beside the choice that is to make room for them.
   */
  emits: ['react', 'all'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const row = ref<HTMLElement | null>(null)
    const grid = ref<HTMLElement | null>(null)
    const all = ref(false)
    /**
     * The six of the row. Where the member's own reaction is none of them -- it was chosen behind
     * "mehr" --, it stands in the place of the last one: what is pressed is in sight, and a press
     * takes it back without a way through the forty-eight.
     */
    const shown = computed<readonly string[]>(() =>
      props.own && !CHAT_QUICK_REACTIONS.includes(props.own)
        ? [...CHAT_QUICK_REACTIONS.slice(0, -1), props.own]
        : CHAT_QUICK_REACTIONS,
    )

    /**
     * Where the keyboard stands in the row -- its one stop for Tab; the last place is "mehr". On the
     * member's own reaction where there is one, as a choice of one has it: else on the first.
     */
    const rowAt = ref(Math.max(0, shown.value.indexOf(props.own as string)))
    /** Where it stands among the forty-eight. */
    const gridAt = ref({ row: 0, column: 0 })

    /**
     * An emoji was pressed: said upwards -- not while a reaction is on its way.
     *
     * Pressed among the forty-eight, the row of six is back with it: the choice is made. In a menu
     * that closes with the press nobody sees it; where the choice stays -- in the opened row of the
     * booking list -- the forty-eight would otherwise stand there for good. The keyboard, where it
     * stood among them, goes to the emoji that was pressed if the row shows it, else to "mehr":
     * the button it stood on is gone.
     */
    const press = async (emoji: string) => {
      if (props.busy) {
        return
      }
      emit('react', emoji)
      if (!all.value) {
        return
      }
      const keyboardInside = Boolean(grid.value?.contains(document.activeElement))
      all.value = false
      emit('all', false)
      const at = shown.value.indexOf(emoji)
      rowAt.value = at === -1 ? shown.value.length : at
      await nextTick()
      if (keyboardInside) {
        row.value
          ?.querySelector<HTMLElement>(`[data-index="${rowAt.value}"]`)
          ?.focus({ preventScroll: true })
      }
    }

    /** What a press on an emoji does, in words -- for the pointer that rests on it. */
    const hintOf = (emoji: string) =>
      emoji === props.own
        ? t('chatThread.reactTakeBack', { emoji })
        : t('chatThread.reactWith', { emoji })

    /** The arrows move along the row and stop at its ends; Home and End go to them. */
    const moveInRow = (event: KeyboardEvent) => {
      const next = emojiGridStep({ row: 0, column: rowAt.value }, event, shown.value.length + 1)
      if (!next) {
        return
      }
      event.preventDefault()
      if (next.row !== 0) {
        return
      }
      row.value
        ?.querySelector<HTMLElement>(`[data-index="${next.column}"]`)
        ?.focus({ preventScroll: true })
    }

    const focusInGrid = ({ row: r, column: c }: { row: number; column: number }) =>
      grid.value
        ?.querySelector<HTMLElement>(`[data-row="${r}"][data-column="${c}"]`)
        ?.focus({ preventScroll: true })

    const moveInGrid = (event: KeyboardEvent) => {
      const next = emojiGridStep(gridAt.value, event, EMOJI_ROWS[0].length)
      if (!next) {
        return
      }
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
        const column = line.indexOf(props.own as string)
        if (column !== -1) {
          gridAt.value = { row: r, column }
        }
      }
      await nextTick()
      focusInGrid(gridAt.value)
    }

    return () => (
      <div
        class={[c('chat-reaction-choice'), props.busy ? c('is-busy') : '']}
        data-test='chat-reaction-choice'
      >
        {/* The reactions a press away (Bernd, 11.10.2026): his six in a row, and "mehr" behind them
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
            reaction from behind "mehr", and a button that is replaced loses the keyboard. */}
        {!all.value ? (
          <div
            key='row'
            ref={row}
            role='toolbar'
            class={c('chat-reaction-choice-row')}
            aria-label={t('chatThread.react')}
            aria-busy={props.busy ? 'true' : undefined}
            data-test='chat-reaction-row'
            onKeydown={moveInRow}
          >
            {shown.value.map((emoji, index) => (
              <button
                key={index}
                type='button'
                class={[c('chat-reaction-choice-emoji'), emoji === props.own ? c('is-own') : '']}
                tabindex={index === rowAt.value ? 0 : -1}
                aria-pressed={emoji === props.own ? 'true' : 'false'}
                aria-disabled={props.busy ? 'true' : undefined}
                title={hintOf(emoji)}
                data-index={index}
                data-test='chat-reaction-quick'
                onClick={() => press(emoji)}
                onFocus={() => {
                  rowAt.value = index
                }}
              >
                {emoji}
              </button>
            ))}
            <button
              type='button'
              class={c('chat-reaction-choice-more')}
              tabindex={rowAt.value === shown.value.length ? 0 : -1}
              aria-label={t('chatThread.reactMore')}
              title={t('chatThread.reactMore')}
              data-index={shown.value.length}
              data-test='chat-reaction-more'
              onClick={showAll}
              onFocus={() => {
                rowAt.value = shown.value.length
              }}
            >
              <IMdiPlus class={c('chat-reaction-choice-more-icon')} aria-hidden='true' />
            </button>
          </div>
        ) : (
          // All forty-eight, in the place of the row -- and of the menu's entries, which the menu
          // takes away meanwhile (`all`): so the menu is no higher with them than without. The grid
          // of the smiley's choice (EmojiPicker): one stop for Tab, the arrows move in it.
          <div
            key='grid'
            ref={grid}
            role='grid'
            class={c('chat-reaction-choice-grid')}
            aria-label={t('chatThread.react')}
            aria-busy={props.busy ? 'true' : undefined}
            data-test='chat-reaction-grid'
            onKeydown={moveInGrid}
          >
            {EMOJI_ROWS.map((line, r) => (
              <div key={r} role='row' class={c('chat-reaction-choice-line')}>
                {line.map((emoji, column) => (
                  <span key={emoji} role='gridcell'>
                    <button
                      type='button'
                      class={[
                        c('chat-reaction-choice-emoji'),
                        emoji === props.own ? c('is-own') : '',
                      ]}
                      tabindex={r === gridAt.value.row && column === gridAt.value.column ? 0 : -1}
                      aria-pressed={emoji === props.own ? 'true' : 'false'}
                      aria-disabled={props.busy ? 'true' : undefined}
                      title={hintOf(emoji)}
                      data-row={r}
                      data-column={column}
                      data-test='chat-reaction-emoji'
                      onClick={() => press(emoji)}
                      onFocus={() => {
                        gridAt.value = { row: r, column }
                      }}
                    >
                      {emoji}
                    </button>
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
})
