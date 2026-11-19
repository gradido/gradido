// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChatReactionChoice } from '@/components/Chat/ChatReactionChoice'
import IMdiContentCopy from '~icons/mdi/content-copy'
import IMdiPencilOutline from '~icons/mdi/pencil-outline'
import IMdiReplyOutline from '~icons/mdi/reply-outline'
import IMdiShareOutline from '~icons/mdi/share-outline'
import classes from './ChatMessageMenu.module.scss'

/** A class by its name and in the module's spelling: the stylesheet's rules hang on the latter. */
const c = (name: string) => [name, classes[name]]

/**
 * The entries of the menu at a message (E-059, E-060), and over them the reactions. What may be
 * done, the bubble decides: only one's own words are changed, a transfer is neither answered nor
 * forwarded, a picture without words has no text to copy, and a reaction is offered only in a
 * conversation of this community.
 */
export const ChatMessageMenu = defineComponent({
  name: 'ChatMessageMenu',
  props: {
    /** One's own message: the menu keeps to the right, as the bubble does. */
    mine: { type: Boolean, default: false },
    /** No room above the message in the thread: the menu opens under it. */
    below: { type: Boolean, default: false },
    canReply: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    /** The message is a video invitation: "Bearbeiten" changes its topic and its time. */
    video: { type: Boolean, default: false },
    canForward: { type: Boolean, default: false },
    canCopy: { type: Boolean, default: false },
    /** The member may react to the message: the row of emoji stands over the entries. */
    canReact: { type: Boolean, default: false },
    /** The emoji the member has reacted with already, or null. */
    ownReaction: { type: String as PropType<string | null>, default: null },
    /** A reaction of the member's to this message is on its way: the emoji take no press. */
    reacting: { type: Boolean, default: false },
  },
  /**
   * `react`: an emoji of the reactions was pressed -- which one. `resized`: the menu is of another
   * size than it was, because all forty-eight are shown now.
   */
  emits: ['reply', 'edit', 'forward', 'copy', 'react', 'resized'],
  setup(props, { emit }) {
    const { t } = useI18n()

    /** All forty-eight emoji are shown: they take the place of the entries. */
    const all = ref(false)
    const hasEntries = computed(
      () => props.canReply || props.canEdit || props.canForward || props.canCopy,
    )
    const showsAll = (shown: boolean) => {
      all.value = shown
      emit('resized')
    }

    return () => (
      <div
        class={[
          c('chat-message-menu'),
          props.mine ? c('is-mine') : '',
          props.below ? c('is-below') : '',
          props.canReact ? c('has-reactions') : '',
        ]}
        tabindex='-1'
        role='group'
        aria-label={t('chatThread.menuLabel')}
        data-test='chat-message-menu'
      >
        {/* `tabindex="-1"`: a menu without an entry -- at a transfer, where the reactions are all
            it has -- takes the keyboard itself when it opens (ChatBubble's `openMenu`). No stop
            for Tab. */}
        {/* The menu at a message (Bernd, 30.09.2026, E-059): drawn as the paperclip's menu is
            (ChatComposeBar) -- the sign in gold, the word, a quieter line under it -- over the
            message, at its side; under it where there is no room above. A group of buttons, as the
            paperclip's: Tab reaches them, Esc closes (the bubble handles it). Inside the root, not
            over it: one root element takes the bubble's listener. */}
        {/* The reactions over the entries (Bernd, 11.10.2026): six emoji a press away, and "mehr"
            for all forty-eight -- which then stand in the place of the row and of the entries
            (`all`): the menu is as wide with them as without, and of another height, which whoever
            places the menu is told. A press says which emoji; the menu closes. */}
        {props.canReact ? (
          <ChatReactionChoice
            class={[
              c('chat-message-menu-reactions'),
              all.value || !hasEntries.value ? c('is-alone') : '',
            ]}
            own={props.ownReaction}
            busy={props.reacting}
            onReact={(emoji: string) => emit('react', emoji)}
            onAll={showsAll}
          />
        ) : null}
        {!all.value ? (
          <>
            {/* "Antworten" first (Bernd, 09.10.2026), at every message of the conversation: the next
                message quotes this one. */}
            {props.canReply ? (
              <button
                type='button'
                class={c('chat-message-menu-item')}
                data-test='chat-message-reply'
                onClick={() => emit('reply')}
              >
                <IMdiReplyOutline class={c('chat-message-menu-icon')} aria-hidden='true' />
                <span class={c('chat-message-menu-words')}>
                  <span class={c('chat-message-menu-label')}>{t('chatThread.reply')}</span>
                  <span class={c('chat-message-menu-hint')}>{t('chatThread.replyHint')}</span>
                </span>
              </button>
            ) : null}
            {/* "Bearbeiten" (Bernd, 01.10.2026, E-060), at one's own message only: its text -- or, at a
                video invitation, its topic and its time. */}
            {props.canEdit ? (
              <button
                type='button'
                class={c('chat-message-menu-item')}
                data-test='chat-message-edit'
                onClick={() => emit('edit')}
              >
                <IMdiPencilOutline class={c('chat-message-menu-icon')} aria-hidden='true' />
                <span class={c('chat-message-menu-words')}>
                  <span class={c('chat-message-menu-label')}>{t('chatThread.edit')}</span>
                  <span class={c('chat-message-menu-hint')}>
                    {props.video ? t('chatThread.editVideoHint') : t('chatThread.editHint')}
                  </span>
                </span>
              </button>
            ) : null}
            {props.canForward ? (
              <button
                type='button'
                class={c('chat-message-menu-item')}
                data-test='chat-message-forward'
                onClick={() => emit('forward')}
              >
                <IMdiShareOutline class={c('chat-message-menu-icon')} aria-hidden='true' />
                <span class={c('chat-message-menu-words')}>
                  <span class={c('chat-message-menu-label')}>{t('chatThread.forward')}</span>
                  <span class={c('chat-message-menu-hint')}>{t('chatThread.forwardHint')}</span>
                </span>
              </button>
            ) : null}
            {props.canCopy ? (
              <button
                type='button'
                class={c('chat-message-menu-item')}
                data-test='chat-message-copy'
                onClick={() => emit('copy')}
              >
                <IMdiContentCopy class={c('chat-message-menu-icon')} aria-hidden='true' />
                <span class={c('chat-message-menu-words')}>
                  <span class={c('chat-message-menu-label')}>{t('chatThread.copyText')}</span>
                  <span class={c('chat-message-menu-hint')}>{t('chatThread.copyTextHint')}</span>
                </span>
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    )
  },
})
