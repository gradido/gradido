// AI-GENERATED — not an architecture reference
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChatWindowSize } from '@/composables/useChatWindowSize'
import IMdiArrowCollapse from '~icons/mdi/arrow-collapse'
import IMdiArrowExpand from '~icons/mdi/arrow-expand'
import classes from './ChatWindowSizeToggle.module.scss'
import './ChatWindowSizeToggle.scss'

export const ChatWindowSizeToggle = defineComponent({
  name: 'ChatWindowSizeToggle',
  setup() {
    const { t } = useI18n()
    const { large, toggleLarge } = useChatWindowSize()

    /** Two written-out keys, not one chosen by a condition: the i18n lint counts only keys it can read. */
    const name = computed(() => (large.value ? t('chatWindow.reduce') : t('chatWindow.enlarge')))

    return () => (
      // The switch between the chat window as it always was and a large one (Bernd, 12.10.2026),
      // between the magnifier and the cross, in a contact's window and a group's alike.
      //
      // Its name says what a press does, and follows the state -- "enlarge" on the usual window,
      // "reduce" on the large one. No `aria-pressed` beside it: a name that changes and a pressed
      // state would say the same thing twice, and differently.
      //
      // Not on a phone: there the window is a sheet over the whole screen already (the
      // stylesheet).
      <button
        type='button'
        class={['chat-window-size-toggle', classes['chat-window-size-toggle']]}
        aria-label={name.value}
        title={name.value}
        data-test='chat-window-size'
        onClick={toggleLarge}
      >
        {large.value ? (
          <IMdiArrowCollapse aria-hidden='true' />
        ) : (
          <IMdiArrowExpand aria-hidden='true' />
        )}
      </button>
    )
  },
})
