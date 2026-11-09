// AI-GENERATED — not an architecture reference
/**
 * One person in the contact list: face, name, how long and how often, the heart -- and the
 * gold dot while a message from them waits unread.
 *
 * `contact` is what contactListQuery delivers: { user, firstAt, lastAt, bookings,
 * unreadChatMessages, chatPreview }. The user is the booking row's shape, so face and name are
 * drawn by the same helpers the booking row uses -- the list cannot come to name somebody
 * differently.
 */
import { BCol, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatPreviewLine from '@/components/Chat/ChatPreviewLine.vue'
import ChatUnreadDot from '@/components/Chat/ChatUnreadDot.vue'
import { type Contact, contactDisplay, contactMeta } from '@/components/Contacts/contactDisplay'
import FavoriteHeart from '@/components/FavoriteHeart.vue'
import Name from '@/components/TransactionRows/Name.vue'
import { LIST_AVATAR_SIZE } from '@/constants'
import classes from './ContactRow.module.scss'

export const ContactRow = defineComponent({
  name: 'ContactRow',
  props: {
    contact: { type: Object as PropType<Contact>, required: true },
  },
  // The row says which person was tapped; the LIST owns the window (one per list, not one
  // per row -- the same reason the heart's confirmation is `lazy`).
  emits: ['open'],
  setup(props, { emit }) {
    const { t, d } = useI18n()

    // How often and how recently -- or, where there is nothing to count yet, what made the two
    // of them contacts. Through the shared builder, so the row and the window cannot come to
    // say it differently (contactDisplay.ts).
    const meta = computed(() => contactMeta(props.contact, { t, d }))

    // Through the shared helper, so the list, the column, the strip and the window cannot come
    // to draw one person four ways. The avatar stands outside the row's button here, so it may
    // carry the zoom.
    const avatar = computed(() => contactDisplay(props.contact, { zoomable: true }).avatar)

    // The community's line, unless the latest word stands instead of it: for somebody of the
    // member's own community (E-083, Bernd's choice "statt Gradido-Akademie"). Somebody of another
    // community keeps the name of theirs, and has the latest word at the end of the row.
    // `homeCommunity` is the server's answer -- the wallet cannot tell its own community by the
    // name (contacts.graphql).
    const communityShown = computed(
      () =>
        Boolean(props.contact.user.communityName) &&
        !(props.contact.chatPreview && props.contact.homeCommunity),
    )

    // What the line shows waits unread -- a message of theirs above the member's pointer, or a
    // transfer of theirs the member has not seen (Chat E-086, Bernd, 26.10.2026: until then a
    // booking never waited): the server's word, which knows the pointer and what was seen.
    const previewUnread = computed(() => props.contact.chatPreview?.unread === true)

    return () => (
      <BRow
        alignV='center'
        class={['contact-row', classes['contact-row'], 'py-2']}
        data-test='contact-row'
      >
        <BCol cols='auto'>
          <AppAvatar size={LIST_AVATAR_SIZE} color='#fff' {...avatar.value} />
        </BCol>
        <BCol class={['min-w-0', classes['min-w-0']]}>
          {/* ⛔ A button, and the name inside it is not a second one (KF-010). A tap on a
              contact opens the contact window; the send form is one of the two ways OUT of
              that window, not what a tap means any more. `Name` opens that same window itself
              wherever the row around it means something else -- a booking row toggles its
              details -- so here it is told not to (`opens={false}`): a button inside a button
              is invalid HTML with no agreed behaviour, and it would make this row's accessible
              name the sum of two controls.

              The face beside it keeps what it had: where there is a picture it opens at full
              size (AS-018) and stops the click itself, so one circle keeps one meaning. Where
              there is none the circle is inert, and the name is what one taps. */}
          <button
            type='button'
            class={['contact-row-open', classes['contact-row-open']]}
            data-test='contact-row-open'
            onClick={() => emit('open', props.contact)}
          >
            <span class={['contact-row-text', classes['contact-row-text']]}>
              <span class='fw-bold d-block'>
                <Name
                  linkedUser={props.contact.user}
                  withCommunity={false}
                  opens={false}
                  fontColor='text-dark'
                />
              </span>
              {/* The community in a line of its own (mockup V02) -- not behind the name, where
                  the booking row puts it for a member of ANOTHER community only. Where the row
                  shows the latest word of somebody of the member's own community, it stands
                  instead of this line (E-083): the name it said is the member's own. */}
              {communityShown.value ? (
                <span class='small text-muted d-block' data-test='contact-community'>
                  {props.contact.user.communityName}
                </span>
              ) : null}
              <span class='small text-muted d-block' data-test='contact-meta'>
                {meta.value}
              </span>
              {/* The beginning of the latest message, or of the latest booking where that came
                  later (E-083) -- always the last line, under how often and how recently (E-085).
                  Dark while a message from them waits unread; a booking waits for nobody. */}
              {props.contact.chatPreview ? (
                <ChatPreviewLine preview={props.contact.chatPreview} unread={previewUnread.value} />
              ) : null}
            </span>
            {/* At the end of the row, as in mockup V03, and inside the button: its sentence
                becomes part of the row's name. Beside the last line, the latest word (E-085). */}
            <ChatUnreadDot
              count={props.contact.unreadChatMessages}
              class={['contact-row-dot', classes['contact-row-dot'], 'ms-2']}
            />
          </button>
        </BCol>
        <BCol cols='auto'>
          <FavoriteHeart member={props.contact.user} />
        </BCol>
      </BRow>
    )
  },
})
