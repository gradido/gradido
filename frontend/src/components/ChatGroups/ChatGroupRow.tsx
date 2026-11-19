// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppAvatar } from '@/components/AppAvatar'
import { ChatPreviewLine } from '@/components/Chat/ChatPreviewLine'
import { ChatUnreadDot } from '@/components/Chat/ChatUnreadDot'
import { chatGroupAvatar, chatGroupMeta } from '@/components/ChatGroups/chatGroupDisplay'
import { LIST_AVATAR_SIZE } from '@/constants'
import IMdiBellOffOutline from '~icons/mdi/bell-off-outline'
import classes from './ChatGroupRow.module.scss'

/** What the row reads of one of `chatGroupsQuery` (graphql/chatGroups.graphql). */
type ChatGroup = {
  title: string
  communityName?: string | null
  chatPreview?: { mine?: boolean } | null
  unreadMessages?: number
  mutedByMe?: boolean
}

/**
 * One chat group (P5) in the list on "Kontakte & Chat": its square, its name, its community, how
 * many are in it and when the latest message came -- and last the beginning of that message, which
 * then stands instead of the community (E-083, E-085) --, the gold dot while one waits unread, the
 * crossed bell where the member muted it.
 *
 * `group` is one of `chatGroupsQuery` (graphql/chatGroups.graphql). The row says which group was
 * tapped; the page owns the window, as it does for the contacts.
 */
export const ChatGroupRow = defineComponent({
  name: 'ChatGroupRow',
  props: {
    group: { type: Object as PropType<ChatGroup>, required: true },
  },
  emits: ['open'],
  setup(props, { emit }) {
    const { t, d } = useI18n()

    const avatar = computed(() => chatGroupAvatar(props.group))
    const meta = computed(() => chatGroupMeta(props.group, { t, d }))

    return () => (
      <BRow
        alignV='center'
        class={['chat-group-row', classes['chat-group-row'], 'py-2']}
        data-test='chat-group-row'
      >
        <BCol cols='auto'>
          {/* The group's square (E-050 F3): its letters, never a picture, so nothing to zoom. */}
          <AppAvatar size={LIST_AVATAR_SIZE} color='#fff' {...avatar.value} />
        </BCol>
        <BCol class={['min-w-0', classes['min-w-0']]}>
          {/* The whole text is one button, as in the contact row (KF-010): a tap opens the group's
              window. The gold dot stands inside it, so its sentence becomes part of the button's
              name ("Gradido-Café Berlin … 2 neue Nachrichten"). */}
          <button
            type='button'
            class={['chat-group-row-open', classes['chat-group-row-open']]}
            data-test='chat-group-row-open'
            onClick={() => emit('open', props.group)}
          >
            <span class={['chat-group-row-text', classes['chat-group-row-text']]}>
              <span
                class={[
                  'chat-group-row-title',
                  classes['chat-group-row-title'],
                  'fw-bold',
                  'd-block',
                ]}
                data-test='chat-group-title'
              >
                {props.group.title}
              </span>
              {/* The community in a line of its own, as the contact row has it (E-026: in P5 the
                  group's and every member's) -- until the group has a latest message: its line
                  stands instead of this one (E-083). A group is named a community only where it is
                  the member's own (chatGroupsOf), and that is the name the line stands in for. */}
              {props.group.communityName && !props.group.chatPreview ? (
                <span class='small text-muted d-block' data-test='chat-group-community'>
                  {props.group.communityName}
                </span>
              ) : null}
              <span class='small text-muted d-block' data-test='chat-group-meta'>
                {meta.value}
              </span>
              {/* The beginning of the latest message and who wrote it (E-083) -- always the last
                  line, under how many and how recently, as in the contact row (E-085); dark while
                  one waits unread. */}
              {props.group.chatPreview ? (
                <ChatPreviewLine
                  preview={props.group.chatPreview}
                  unread={(props.group.unreadMessages ?? 0) > 0 && !props.group.chatPreview.mine}
                />
              ) : null}
            </span>
            {/* What waits unread for the member -- also in a muted group: muting holds back the
                mails, not the messages, and the mark in the menu counts it too (E-024). Beside the
                last line, the latest message, as in the contact row (E-085). */}
            <ChatUnreadDot
              count={props.group.unreadMessages}
              class={['chat-group-row-dot', classes['chat-group-row-dot'], 'ms-2']}
            />
          </button>
        </BCol>
        {/* Where a contact has its heart: the crossed bell of a group the member muted (E-024), a
            mark and not a control -- the bell to switch it is in the group's window. */}
        <BCol cols='auto' class={['chat-group-row-end', classes['chat-group-row-end']]}>
          {props.group.mutedByMe ? (
            <span
              class={['chat-group-row-muted', classes['chat-group-row-muted']]}
              role='img'
              aria-label={t('chatGroup.muted')}
              title={t('chatGroup.muted')}
              data-test='chat-group-muted'
            >
              <IMdiBellOffOutline
                class={['chat-group-row-muted-icon', classes['chat-group-row-muted-icon']]}
                aria-hidden='true'
              />
            </span>
          ) : null}
        </BCol>
      </BRow>
    )
  },
})
