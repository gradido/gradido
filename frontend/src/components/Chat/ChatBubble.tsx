// AI-GENERATED — not an architecture reference
import {
  type CSSProperties,
  computed,
  defineComponent,
  inject,
  nextTick,
  onBeforeUnmount,
  type PropType,
  provide,
  ref,
  withKeys,
  withModifiers,
} from 'vue'
import { useI18n } from 'vue-i18n'
// The face of the handwriting: declared once for every place that sets a line in it.
import '@/assets/fonts/caveat/caveat.css'
import { AppAvatar } from '@/components/AppAvatar'
import { ChatBubbleImage } from '@/components/Chat/ChatBubbleImage'
import { ChatMessageMenu } from '@/components/Chat/ChatMessageMenu'
import ChatMessageText from '@/components/Chat/ChatMessageText'
import { ChatTransferCoin } from '@/components/Chat/ChatTransferCoin'
import { ChatSearchText } from '@/components/Chat/chatSearchMarks'
import { I18nText } from '@/components/I18nText'
import { ThanksNudge } from '@/components/ThanksNudge'
import { ThankYouGreetingPhoto } from '@/components/ThankYouGreeting/ThankYouGreetingPhoto'
import MemoText from '@/components/TransactionRows/MemoText'
import { Name } from '@/components/TransactionRows/Name'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { useSheet } from '@/composables/useSheet'
import { useAppToast } from '@/composables/useToast'
import { LIST_AVATAR_SIZE, SHEET_FACE_SIZE } from '@/constants'
import { CHAT_MENU_GAP_PX, chatMenuSpot } from '@/utils/chatMenuSpot'
import { ownChatReaction } from '@/utils/chatReactions'
import { CHAT_VIDEO_JOIN, CHAT_VIDEO_JOINED } from '@/utils/chatVideoApp'
import {
  chatVideoCalendarFile,
  chatVideoCalendarFileName,
  chatVideoCalendarUid,
  chatVideoInvitation,
  chatVideoPlannedCall,
  saveChatVideoCalendarFile,
} from '@/utils/chatVideoCalendar'
import { readChatVideoInvite } from '@/utils/chatVideoInvite'
import { memberAlias } from '@/utils/gradidoAddress'
import { canWriteByHand } from '@/utils/handwriting'
import { isComputer } from '@/utils/isComputer'
import { greetingParts } from '@/utils/thankYouGreeting'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
} from '@/utils/thankYouMotifs'
import { transactionPictureShown } from '@/utils/transactionPicture'
import IMdiCalendarPlusOutline from '~icons/mdi/calendar-plus-outline'
import IMdiCheck from '~icons/mdi/check'
import IMdiCheckAll from '~icons/mdi/check-all'
import IMdiContentDuplicate from '~icons/mdi/content-duplicate'
import IMdiDotsHorizontal from '~icons/mdi/dots-horizontal'
import IMdiEmailOutline from '~icons/mdi/email-outline'
import IMdiImageOutline from '~icons/mdi/image-outline'
import IMdiShare from '~icons/mdi/share'
import classes from './ChatBubble.module.scss'
// The marks of the thread's search: the block that was not scoped.
import './ChatBubble.scss'

/** A class by its name and in the module's spelling: the stylesheet's rules hang on the latter. */
const c = (name: string) => [name, classes[name]]

/**
 * ⛔ The enum NAMES, not the column values. The backend registers the database objects
 * (`{ EMAIL: 'email', … }`) as GraphQL enums, and a GraphQL enum goes over the wire by its
 * name -- measured with type-graphql 1.1.1 and graphql 15.10.2, the backend's own versions:
 * a model holding 'email' / 'pending' answers "EMAIL" / "PENDING". A comparison against the
 * lower-case value would never be true, and nothing would say so.
 */
const NOTIFY_EMAIL = 'EMAIL'
const STATE_PENDING = 'PENDING'
const STATE_FAILED = 'FAILED'
const MAIL_MAILED = 'MAILED'
const MAIL_MUTED = 'MUTED'

/** A member as the server names one with a message: the pair, and the alias where it is known. */
interface ChatMember {
  gradidoID?: string | null
  communityUuid?: string | null
  alias?: string | null
}

/** The message an answer quotes, as the server sends it with the answer. */
interface ChatQuoted {
  mine?: boolean
  excerpt?: string | null
  hasImage?: boolean
  senderUser?: ChatMember | null
}

/** A reaction as a message carries it: each emoji once. */
interface ChatReaction {
  emoji: string
  count: number
  mine: boolean
}

/**
 * One message of chatMessagesWithMemberQuery or chatGroupMessagesQuery, or a transfer the thread
 * made a message of -- what the bubble reads off it. The queries are untyped (.graphql), so this
 * is the bubble's own account of them.
 */
export interface ChatBubbleMessage {
  messageUuid?: string | null
  mine?: boolean
  transfer?: boolean
  subject?: string | null
  /**
   * The readers it is handed to (.js) say `string` and take a missing one as well: hence the
   * `as string` at those calls.
   */
  body?: string | null
  createdAt: string | number | Date
  editedAt?: string | null
  sender?: ChatMember | null
  senderUser?: ChatMember | null
  announcement?: boolean | null
  images?: { imageUuid: string; width: number; height: number }[] | null
  deliveryState?: string | null
  mailState?: string | null
  notify?: string | null
  forwarded?: boolean | null
  forwardedFrom?: ChatMember | null
  replyTo?: ChatQuoted | null
  reactions?: ChatReaction[] | null
  /** At a transfer: the server's word on whether the member may react to the booking. */
  canReact?: boolean | null
  greeting?: { motif?: string | null; line?: string | null; hasPicture?: boolean | null } | null
  greetingSender?: string | null
  picture?: { motif: string | null; hasPicture: boolean } | null
  linkId?: number | null
  transactionId?: number | null
}

/** One to thank after a call in a group's thread: what ThanksNudge draws, and the user behind it. */
type ThanksMember = NonNullable<InstanceType<typeof ThanksNudge>['$props']['choices']>[number] & {
  user?: unknown
}

/** The window's hand for a video link: the link, and the message it stands in. */
type VideoLinkHand = (url: string, messageUuid?: string | null) => unknown

export const ChatBubble = defineComponent({
  name: 'ChatBubble',
  props: {
    /** One message of chatMessagesWithMemberQuery -- or of chatGroupMessagesQuery in a group. */
    message: { type: Object as PropType<ChatBubbleMessage>, required: true },
    /**
     * The other person's name -- what a screen reader hears over their messages. In a group, the
     * group's name (a planned call's calendar entry is named after it); the writer of a message
     * comes with the message there.
     */
    alias: { type: String, default: '' },
    /** Whether the message stands in a group's thread (P5): then who wrote it is shown at it. */
    inGroup: { type: Boolean, default: false },
    /**
     * In a group: whether the face and the name stand over this message -- the first of a run by
     * the same writer. The thread decides it; it knows the message before.
     */
    showWriter: { type: Boolean, default: true },
    /** The hit the thread's search stands on (E-057): the bubble is ringed, its marks stronger. */
    searchCurrent: { type: Boolean, default: false },
    /** The message whose text stands in the bar to be changed (E-060): ringed, as under its menu. */
    editing: { type: Boolean, default: false },
    /** The message the bar's next message answers: ringed, as the one being changed is. */
    answering: { type: Boolean, default: false },
    /** The message a quotation was pressed for, just put in sight: ringed for a moment. */
    shown: { type: Boolean, default: false },
    /**
     * The message this one answers, where the thread holds it: quoted from there, with its words
     * as they stand in the thread -- a change made since the page came is in them. Null where the
     * quoted message is on an older page; the bubble quotes what the server sent then
     * (`message.replyTo`).
     */
    quotedMessage: { type: Object as PropType<ChatBubbleMessage | null>, default: null },
    /**
     * Whether a member may react to the messages of this thread (Bernd, 11.10.2026): the thread
     * says so -- not in a conversation with a person of another community, whose server a
     * reaction has no way to yet.
     */
    canReact: { type: Boolean, default: false },
    /**
     * A reaction of the member's to this message is on its way: the emoji in the menu take no
     * press until the answer is in, and show it (ChatReactionChoice's `busy`).
     */
    reactionUnderway: { type: Boolean, default: false },
    /**
     * Whether the suggestion to thank stands under this message (W2): a video invitation of one's
     * own half an hour after the call began, or somebody else's half an hour after the member's
     * click on its link (E-043 C) -- the thread decides it (utils/thanksNudge), it holds the
     * transfers and knows what was answered and clicked on this device.
     */
    thanksAfterCall: { type: Boolean, default: false },
    /**
     * In a group's thread, whom the member may thank after a call of their own (Bernd,
     * 28.10.2026): the members but the member themselves, each `{ key, label, avatar, user }` --
     * the thread makes them from the group's members, for each call, without those thanked since
     * it began (E-043 B). Null in the thread with one person, where "Danke sagen" thanks that
     * person.
     */
    thanksMembers: { type: Array as PropType<ThanksMember[] | null>, default: null },
    /**
     * The ticks behind the time (Chat E-093): 'read' where the other member of a conversation of
     * two has read the message, 'delivered' where not yet, null for none -- somebody else's message,
     * a transfer, a group, or where it is not known. The thread decides it.
     */
    receipt: { type: String as PropType<string | null>, default: null },
  },
  /**
   * `openImage`: the member wants the message's picture large -- `{ message, image, opener }`, the
   * button that was pressed among them (the thread opens the view, ChatImageView).
   */
  /**
   * `openImage`: a picture of the message, large (P7). `openMember`: the writer of somebody else's
   * message in a group, named over it (E-053) -- the user the server named with it. `forward`: the
   * message, to be forwarded (E-059) -- the page asks where to. `edit`: one's own message, to be
   * changed (E-060) -- the thread puts its text into the bar, or hands a video invitation to the
   * window's question. `reply`: the message, to be answered -- the thread puts it over the bar.
   * `showQuoted`: the quotation over an answer was pressed -- `message.replyTo`, for the thread to
   * go to the quoted message. `react`: an emoji of the menu's reactions was pressed --
   * `{ message, emoji }`; the thread knows whether that sets it or takes it back. `thank`: "Danke
   * sagen" under a video invitation of one's own (W2) -- the message, and in a group's thread the
   * user of the member chosen as well; the thread remembers the answer and the window opens the
   * send form. `dismiss`: "Nicht jetzt" there -- the message; the line is not to come back for
   * this call.
   */
  emits: [
    'openImage',
    'openMember',
    'duplicateVideo',
    'forward',
    'edit',
    'reply',
    'showQuoted',
    'react',
    'thank',
    'dismiss',
  ],
  setup(props, { emit }) {
    const { t, d, locale } = useI18n()
    const { toastSuccess, toastError } = useAppToast()

    /**
     * The window's hands for a video link in this bubble (ChatMessageText: the question before
     * joining, and the note that the member went in), handed on with the message they stand in
     * (E-043 C, Bernd 06.11.2026: the device notes the invitation that was clicked) -- not another
     * message that carries the same room, as a call duplicated ahead for the next week does (E-058).
     * Read at the click: the message the bubble shows then. Without a window's hand, none here.
     */
    const windowJoin = inject<VideoLinkHand | null>(CHAT_VIDEO_JOIN, null)
    const windowJoined = inject<VideoLinkHand | null>(CHAT_VIDEO_JOINED, null)
    if (windowJoin) {
      provide(CHAT_VIDEO_JOIN, (url: string) => windowJoin(url, props.message.messageUuid))
    }
    if (windowJoined) {
      provide(CHAT_VIDEO_JOINED, (url: string) => windowJoined(url, props.message.messageUuid))
    }

    /**
     * Who wrote a message of somebody else in a group (P5), as the server named them with it; null in
     * a thread of two, and for one's own. Where their users row is gone the pair stands in, and the
     * face shows no letters.
     */
    const groupWriter = computed(() => {
      if (!props.inGroup || props.message.mine) {
        return null
      }
      return (
        props.message.senderUser ?? {
          gradidoID: props.message.sender?.gradidoID,
          communityUuid: props.message.sender?.communityUuid ?? null,
        }
      )
    })

    /** The name over and in a message: "Du", the writer in a group, the other person otherwise. */
    const writerName = computed(() => {
      if (props.message.mine) {
        return t('chatThread.you')
      }
      const user = groupWriter.value
      return user ? memberAlias(user.alias, user.gradidoID) : props.alias
    })

    /** "You:" or the other person's name, with the colon a listener hears as a pause. */
    const writer = computed(() => `${writerName.value}:`)

    /**
     * The writer's face beside their message in a group, through the helper every list uses: letters
     * from the alias, colour from the digit the server sent, the picture where there is one -- and then
     * it opens large, as every face does. Null where no face stands (a thread of two, one's own).
     */
    const face = computed(() => {
      const user = groupWriter.value
      if (!user) {
        return null
      }
      const base = memberAvatarProps(user)
      return { ...base, ...avatarZoomBindings(user, base) }
    })

    /**
     * The face's size: a list's at the desk, beside the bubble; on a phone the smaller one over it, in
     * the line of the name (Bernd, 16.11.2026) -- the stylesheet places it by `--chat-bubble-face`.
     */
    const sheet = useSheet()
    const faceSize = computed(() => (sheet.value ? SHEET_FACE_SIZE : LIST_AVATAR_SIZE))

    /**
     * Whether the writer's name stands over this bubble as the control that leads to them (E-053):
     * then the ear hears it there, and the name in the bubble would say it twice.
     */
    const writerLinked = computed(() => Boolean(face.value) && props.showWriter)

    /** Somebody else's announcement in a group (E-050 F5): the mark over it. */
    const announced = computed(
      () => props.inGroup && !props.message.mine && Boolean(props.message.announcement),
    )

    const arrived = computed(() => new Date(props.message.createdAt))
    const arrivedIso = computed(() => arrived.value.toISOString())

    /** The picture the message carries (P7): `{ imageUuid, width, height }`, or null. */
    const image = computed(() => props.message.images?.[0] ?? null)

    /** The word under one's own message, where it did not reach the other server (E-019). */
    const stateWord = computed(() => {
      if (!props.message.mine) {
        return ''
      }
      if (props.message.deliveryState === STATE_PENDING) {
        return t('chatThread.pending')
      }
      if (props.message.deliveryState === STATE_FAILED) {
        return t('chatThread.failed')
      }
      return ''
    })

    /**
     * The envelope: a mail about one's own message went out (E-034). The server fills `mailState`
     * only on one's own messages, so `mine` is asked as well, and a stray value on somebody else's
     * message still draws nothing.
     *
     * MAILED is the server saying so. MUTED -- or a value this wallet does not know -- draws none.
     *
     * ⚠️ Null with the wish EMAIL keeps the envelope it had, the sender's wish (P3b). Null is also
     * what the server answers where it knows nothing: a message from before `mailState`, a
     * recipient's server from before it. Dropping the envelope there would take it off the whole
     * history. The price: a new message whose mail was wanted but did not go out (mail switched
     * off on the server, the transport failed) also shows it -- null cannot tell those apart.
     * Not beside a word that says the message has not arrived: a message that did not reach the
     * other server has not been mailed from there.
     */
    const mailed = computed(() => {
      if (!props.message.mine) {
        return false
      }
      if (props.message.mailState === MAIL_MAILED) {
        return true
      }
      if (props.message.mailState) {
        return false
      }
      return props.message.notify === NOTIFY_EMAIL && !stateWord.value
    })

    /**
     * What the envelope says. In a group (P5) one's own mail was an announcement to all (E-050 F5): the
     * bubble says what was asked for, never who got it (E-024).
     */
    const mailedWords = computed(() =>
      props.inGroup ? t('chatGroup.announced') : t('chatThread.mailed'),
    )

    /** The receipt of a message the other member has read (Chat E-093), as the thread names it. */
    const RECEIPT_READ = 'read'

    /** What the ticks say, for the ear and under the pointer: the sign alone carries the state. */
    const receiptWords = computed(() =>
      props.receipt === RECEIPT_READ
        ? t('chatThread.receiptRead')
        : t('chatThread.receiptDelivered'),
    )

    /**
     * The line where no mail went out because the recipient muted the conversation (E-034). There is
     * no "notify anyway": the veto stays with the recipient (E-024), and the sender only learns of it.
     */
    const notMailed = computed(() =>
      props.message.mine && props.message.mailState === MAIL_MUTED
        ? t('chatThread.notMailedMuted', { name: props.alias })
        : '',
    )

    /**
     * The thank-you greeting a transfer was made from (ZE-019): `{ motif, line, hasPicture }` as the
     * booking list delivers it with the booking of an accepted greeting -- on the sender's side and on
     * the recipient's. Null for every other bubble: a transfer without one stays the bubble it was.
     */
    const greeting = computed(() =>
      props.message.transfer ? (props.message.greeting ?? null) : null,
    )

    /** Its picture: none where the greeting has no motif, or one this wallet does not know. */
    const motif = computed(() => thankYouMotif(greeting.value?.motif, t))

    /** Whether it carries a photo of the sender's own in the place of a motif. */
    const hasPhoto = computed(() => greeting.value?.hasPicture === true)

    /**
     * The picture the sender added to a transfer (ZE-016), as the bubble shows it: `{ photo: true }`
     * or `{ motif }` -- or null for a transfer without one, and for a motif this wallet does not
     * know: the bubble of a plain transfer then. A booking made from a greeting never has one.
     */
    const transferPicture = computed(() =>
      props.message.transfer && !greeting.value
        ? transactionPictureShown(props.message.picture, t)
        : null,
    )

    /**
     * The line and, apart from it, the words. The booking's memo begins with the line; where it does
     * not, the memo stands whole as the words and no line over it (greetingParts) -- nothing twice,
     * nothing lost.
     */
    const parts = computed(() => greetingParts(props.message.body as string, greeting.value?.line))

    /** The LINE decides: one letter the handwriting lacks, and all of it is set in the bubble's font. */
    const byHand = computed(() => canWriteByHand(parts.value.line))

    /** The planned video call this message invites to (V5b); null for every other message. */
    const plannedCall = computed(() => chatVideoPlannedCall(props.message.body as string))

    /**
     * The video invitation this message is (E-058), for "Duplizieren": its room, its topic and, planned,
     * its time. None in a transfer, whose words are the booking's memo.
     */
    const videoInvitation = computed(() =>
      props.message.transfer ? null : chatVideoInvitation(props.message.body as string),
    )

    /**
     * "Add to calendar": the call as an iCalendar file -- titled with its topic and the other
     * person's name, the invitation as its note, the room as its place. The same call keeps the same
     * name (`uid`), so a second download is the same entry -- also after the call was changed.
     */
    const addToCalendar = () => {
      const call = plannedCall.value
      if (!call) {
        return
      }
      saveChatVideoCalendarFile(
        chatVideoCalendarFileName(call.topic, call.start),
        chatVideoCalendarFile({
          start: call.start,
          end: call.end,
          title: `${call.topic} – ${props.alias}`,
          description: props.message.body as string,
          url: call.url,
          // A call that was changed keeps the name of its first start, and counts its changes
          // (E-060): the calendar moves the entry it holds instead of adding a second one.
          uid: chatVideoCalendarUid(call.room, call.first ?? call.start),
          sequence: call.sequence ?? 0,
        }),
      )
    }

    /**
     * Over a copy forwarded from another conversation (E-059 F2): "Weitergeleitet von [Nutzername]",
     * with the name of whoever wrote its words first; "Weitergeleitet" alone where the copy names
     * nobody -- the sender forwarded words of their own, or the first writer is not known here ('').
     * Nothing over any other message.
     */
    const forwardedName = computed(() => {
      const from = props.message.forwarded ? props.message.forwardedFrom : null
      return from ? memberAlias(from.alias, from.gradidoID) : ''
    })

    /**
     * The quotation over an answer: `{ name, text, hasImage }`, or null for a message that answers
     * none. The name as a message's writer is named -- "Du", in a group the writer the server named,
     * the other person otherwise. The words on one line, whatever lines the message had; from the
     * message in the thread where it is there, else the beginning the server sent.
     */
    const quote = computed(() => {
      const quoted = props.message.replyTo
      if (!quoted) {
        return null
      }
      const live = props.quotedMessage
      const user = quoted.senderUser
      return {
        // Between two the other person; in a group only whom the server named -- `alias` is the
        // group's name there, and nobody's.
        name: quoted.mine
          ? t('chatThread.you')
          : user
            ? memberAlias(user.alias, user.gradidoID)
            : props.inGroup
              ? ''
              : props.alias,
        text: (live ? (live.body ?? '') : (quoted.excerpt ?? '')).replace(/\s+/g, ' ').trim(),
        hasImage: live ? (live.images?.length ?? 0) > 0 : Boolean(quoted.hasImage),
      }
    })

    /**
     * What the menu at the message offers (E-059): forwarding for every message of the conversation --
     * a transfer is none, and has no row to forward --, and its text to copy where it has one.
     */
    const canForward = computed(() => !props.message.transfer && Boolean(props.message.messageUuid))
    /** "Antworten": every message the server has filed -- a transfer is a booking, and has no row. */
    const canReply = canForward
    const textToCopy = computed(() =>
      props.message.transfer
        ? ''
        : [props.message.subject, props.message.body].filter((part) => part?.trim()).join('\n\n'),
    )
    const canCopy = computed(() => Boolean(textToCopy.value))
    /**
     * "Bearbeiten" (E-060): one's own words only -- not somebody else's message, not a transfer (a
     * booking is no chat text), not a forwarded copy (its words are somebody else's), and not a
     * message the server has not filed yet. The server holds the same rules (editChatMessage).
     */
    const canEdit = computed(
      () =>
        Boolean(props.message.mine) &&
        !props.message.transfer &&
        !props.message.forwarded &&
        Boolean(props.message.messageUuid),
    )
    /**
     * Whether "Bearbeiten" changes this message as the video invitation it is -- its topic and its
     * time, in the window's question -- or as the text it is: the menu's line under the word says
     * which. Read as the thread reads it when the entry is pressed (`startEdit`, readChatVideoInvite):
     * a message that only carries a room's address among words of one's own is text. Looked at only
     * while the menu is open.
     */
    const editsAsVideo = computed(
      () =>
        canEdit.value &&
        readChatVideoInvite({ t, d, locale: locale.value }, props.message.body) !== null,
    )
    const menuEntries = computed(() =>
      [canReply.value, canEdit.value, canForward.value, canCopy.value].filter(Boolean),
    )
    /**
     * The reactions the message carries (Bernd, 11.10.2026): `{ emoji, count, mine }`, each emoji
     * once. At a transfer the one its recipient answered it with, in the same shape -- the thread
     * reads it off the booking (transferReactions).
     */
    const reactions = computed(() => props.message.reactions ?? [])
    /** The emoji the member reacted with themselves, or null: the pressed one in the menu. */
    const ownReaction = computed(() => ownChatReaction({ reactions: reactions.value }))
    /**
     * A reaction as it is said, in one piece: the emoji -- it says its own name --, how many where
     * it is more than one, and that it is one's own.
     */
    const reactionSaid = ({ emoji, count, mine }: ChatReaction) =>
      [
        count > 1 ? `${emoji} ${count}` : emoji,
        ...(mine ? [t('chatThread.reactionMine')] : []),
      ].join(', ')
    /**
     * Whether the menu offers the reactions: where the thread allows them, at every message the
     * server has filed -- somebody else's and one's own. The server holds the same rules
     * (setChatMessageReaction).
     *
     * At a transfer only its recipient reacts, and whether the member may is the server's word,
     * which came with the booking (`canReact`, setTransactionReaction) -- not the thread's: a
     * transfer is a booking, and its rule is the booking list's.
     */
    const reacts = computed(() =>
      props.message.transfer
        ? props.message.canReact === true
        : props.canReact && Boolean(props.message.messageUuid),
    )
    const hasMenu = computed(() => menuEntries.value.length > 0 || reacts.value)

    const row = ref<HTMLElement | null>(null)
    const more = ref<HTMLElement | null>(null)
    const menuOpen = ref(false)
    /** No room above the message in the thread: the menu opens under it. */
    const menuBelow = ref(false)
    /**
     * Where the menu hangs over the page, in the screen's own pixels -- null while it stands in the
     * thread, at its message: that is where it stands wherever the thread can hold it. Decided each
     * time the menu is settled (`settleMenu`), from the thread; what is left of a menu since closed
     * is read by nobody.
     */
    const menuSpot = ref<{ left: number; top: number } | null>(null)
    const menuStyle = computed(() =>
      menuSpot.value
        ? { left: `${menuSpot.value.left}px`, top: `${menuSpot.value.top}px` }
        : undefined,
    )
    /**
     * The room the menu needs above the message: its entries, their frame and its gap. Two entries
     * are 113 px in all ten languages, at 320 and at 1280 px (measured 30.09.2026); three (E-060) are
     * 164 px and 170 with their gap -- 186 where the line under "Bearbeiten" breaks in two, at a video
     * invitation in French and in Greek at 320 px (measured 01.10.2026).
     */
    const MENU_ENTRY_PX = 49
    const MENU_FRAME_PX = 42
    /** The row of reactions over the entries, with the line under it: 44 px, its gap and its rim. */
    const MENU_REACTIONS_PX = 52
    /**
     * All forty-eight behind "mehr", which stand in the place of the row and of the entries: six
     * lines of 36 px -- of up to 44 under a finger (ChatReactionChoice's stylesheet, by the same
     * question). The room has to hold whichever is higher -- 229 px against 216 with three entries,
     * measured 11.10.2026 --, since the menu stays on its side of the message when "mehr" is pressed.
     */
    const allReactionsPx = () => (window.matchMedia?.('(hover: none)')?.matches ? 264 : 216)
    const menuRoom = () => {
      const entries = menuEntries.value.length * MENU_ENTRY_PX
      return (
        MENU_FRAME_PX +
        (reacts.value ? Math.max(entries + MENU_REACTIONS_PX, allReactionsPx()) : entries)
      )
    }

    const menuElement = () => row.value?.querySelector<HTMLElement>('.chat-message-menu') ?? null
    const threadBox = () => row.value?.closest<HTMLElement>('.chat-thread-box') ?? null

    const closeOnPressElsewhere = (event: Event) => {
      if (!row.value?.contains(event.target as Node | null)) {
        closeMenu()
      }
    }

    /**
     * The part of the message that is in sight in the thread, in the screen's pixels -- null where
     * none of it is: the thread has scrolled it away.
     */
    const messageInSight = () => {
      const own = row.value?.getBoundingClientRect()
      const box = threadBox()?.getBoundingClientRect()
      if (!own || !box) {
        return null
      }
      const top = Math.max(own.top, box.top)
      const bottom = Math.min(own.bottom, box.bottom)
      return bottom > top ? { top, bottom, left: own.left, right: own.right } : null
    }

    /** Puts the menu that hangs over the page at its message -- and closes it once that is out of sight. */
    const hangMenu = () => {
      const menu = menuElement()
      if (!menu) {
        return
      }
      const anchor = messageInSight()
      if (!anchor) {
        closeMenu()
        return
      }
      const { width, height } = menu.getBoundingClientRect()
      menuSpot.value = chatMenuSpot({
        anchor,
        size: { width, height },
        screen: { width: document.documentElement.clientWidth, height: window.innerHeight },
        mine: Boolean(props.message.mine),
      })
    }

    /**
     * The menu has its size -- as it opens, and again when "mehr" or the window has changed it.
     *
     * In the thread, at its message, wherever the thread can hold it: the thread then scrolls just so
     * far that the whole menu is in sight. Over the page where the thread is lower than the menu
     * (chatMenuSpot): a phone whose browser leaves 553 px of height has a thread of 207, the menu at
     * one's own message is 267 with its reactions -- and what stood out of the thread was cut off,
     * the reactions first, with the window's own buttons in their place (measured 11.10.2026).
     *
     * ⛔ Measured in the thread first, where it is as wide as the thread lets it be, and never hidden
     * meanwhile: the keyboard may stand on one of its buttons, and what is hidden loses it.
     *
     * ⛔ Only the newest run goes on after a wait (`settling`): a window that changes its size calls
     * in a row, and a run that wakes up behind a newer one would measure the menu where that one
     * has just put it, and place it by that (coderabbit on #4123). Closing the menu ends every run.
     */
    let settling = 0
    const settleMenu = async () => {
      if (!menuOpen.value) {
        return
      }
      settling += 1
      const run = settling
      menuSpot.value = null
      await nextTick()
      if (run !== settling) {
        return
      }
      const menu = menuElement()
      if (!menu) {
        return
      }
      const box = threadBox()
      if (!box?.clientHeight || menu.offsetHeight + 2 * CHAT_MENU_GAP_PX <= box.clientHeight) {
        menu.scrollIntoView?.({ block: 'nearest' })
        return
      }
      // From where it stands, so that nothing jumps: over the page its size is the screen's to
      // limit, so it is measured again there before it is placed.
      const { left, top } = menu.getBoundingClientRect()
      menuSpot.value = { left, top }
      await nextTick()
      if (run !== settling) {
        return
      }
      hangMenu()
    }

    /** The thread or the page moved: a menu over the page follows its message; one in the thread moves with it. */
    const followMenu = () => {
      if (menuSpot.value !== null) {
        hangMenu()
      }
    }

    const forgetMenu = () => {
      document.removeEventListener('pointerdown', closeOnPressElsewhere, true)
      document.removeEventListener('scroll', followMenu, true)
      window.removeEventListener('resize', settleMenu)
    }

    /**
     * Over the message, or under it where the thread has no room above it: at its first messages, since
     * the menu stands inside the scrolling thread and nothing scrolls above its beginning. Measured from
     * the thread's beginning, not from what is in sight -- a tall picture half scrolled out at the top
     * has its room above all the same --, and the thread then scrolls just so far that the whole menu
     * is in sight (`settleMenu`).
     */
    const openMenu = async () => {
      const box = threadBox()
      menuBelow.value = Boolean(
        box &&
          (row.value as HTMLElement).getBoundingClientRect().top -
            box.getBoundingClientRect().top +
            box.scrollTop <
            menuRoom(),
      )
      menuOpen.value = true
      // Another message's menu closes as this one opens: the press was elsewhere for it.
      document.addEventListener('pointerdown', closeOnPressElsewhere, true)
      document.addEventListener('scroll', followMenu, true)
      window.addEventListener('resize', settleMenu)
      await settleMenu()
      const menu = menuElement()
      // The first ENTRY, as before the reactions stood over them: a second Enter on the sign that
      // opened the menu must not set a reaction nobody chose. Where there is no entry -- at a
      // transfer, whose menu is its reactions alone -- the keyboard stands on the menu itself for
      // the same reason, and Tab leads into the row.
      const first = menu?.querySelector<HTMLElement>('.chat-message-menu-item') ?? menu
      first?.focus({ preventScroll: true })
    }

    const closeMenu = ({ focusMore = false } = {}) => {
      if (!menuOpen.value) {
        return
      }
      menuOpen.value = false
      settling += 1
      forgetMenu()
      if (focusMore) {
        more.value?.focus({ preventScroll: true })
      }
    }
    onBeforeUnmount(forgetMenu)

    const toggleMenu = () => (menuOpen.value ? closeMenu({ focusMore: true }) : openMenu())

    /** What in a message is a control of its own: a tap there does what it does. */
    const CONTROLS = 'a, button, input, label, select, textarea, [role="button"]'

    /**
     * A tap on the message, on a phone (E-059 F1): opens its menu, or closes it again. Not on a
     * computer -- a click there places the cursor or starts marking words, and the sign beside the
     * message is the way to the menu --, not on a control in the message, not where words are marked.
     */
    const tapBubble = (event: MouseEvent) => {
      if (!hasMenu.value || isComputer()) {
        return
      }
      if ((event.target as Element | null)?.closest?.(CONTROLS)) {
        return
      }
      if (window.getSelection?.()?.toString()) {
        return
      }
      toggleMenu()
    }

    const forward = () => {
      closeMenu()
      emit('forward', props.message)
    }

    /** "Antworten": the message goes up to the thread, which puts it over the bar. */
    const reply = () => {
      closeMenu()
      emit('reply', props.message)
    }

    /** "Bearbeiten" (E-060): the message goes up to the thread, which knows where it is changed. */
    const edit = () => {
      closeMenu()
      emit('edit', props.message)
    }

    /**
     * An emoji of the reactions was pressed: the message and the emoji go up to the thread, which
     * knows whether that sets the reaction or takes it back. The menu closes, and the keyboard is
     * back on the sign that opened it.
     */
    const react = (emoji: string) => {
      closeMenu({ focusMore: true })
      emit('react', { message: props.message, emoji })
    }

    /** The suggestion to thank under the invitation (W2), for where the keyboard stood in it. */
    const thanksLine = ref<InstanceType<typeof ThanksNudge> | null>(null)

    /**
     * In a group's thread, "Jemandem danken" was pressed: the line shows the members to choose from,
     * and asks whom. Nothing is answered yet -- a window closed now finds the line as it was.
     */
    const choosingThanks = ref(false)

    const thanksQuestion = computed(() => {
      if (!props.thanksMembers) {
        return t('thanksNudge.afterCall', { name: props.alias })
      }
      return choosingThanks.value ? t('thanksNudge.whom') : t('thanksNudge.afterGroupCall')
    })

    /** The way there: with one person, to thank them; in a group, to choose whom. */
    const thankFor = () => {
      if (props.thanksMembers) {
        choosingThanks.value = true
        return
      }
      emit('thank', props.message)
    }

    /** A member was chosen in a group's thread: thanked as the person of a conversation of two is. */
    const thankMember = (key: string) => {
      const chosen = props.thanksMembers?.find((member) => member.key === key)
      if (chosen) {
        emit('thank', props.message, chosen.user)
      }
    }

    /**
     * "Nicht jetzt": the line goes, and does not come back for this call -- the thread remembers it.
     * A keyboard that stood on it would fall out of the window with it; it goes to the thread
     * instead, where the keyboard was, as when the button for older messages goes (ChatThread).
     */
    const dismissThanks = async () => {
      const hadKeyboard = Boolean(thanksLine.value?.$el?.contains?.(document.activeElement))
      emit('dismiss', props.message)
      if (!hadKeyboard) {
        return
      }
      await nextTick()
      threadBox()?.focus({ preventScroll: true })
    }

    /** "Text kopieren" (E-059 F6): the subject and the text as they were written. */
    const copyText = async () => {
      closeMenu({ focusMore: true })
      try {
        await navigator.clipboard.writeText(textToCopy.value)
        toastSuccess(t('chatThread.textCopied'))
      } catch {
        // Refused, or no clipboard at all.
        toastError(t('chatThread.textNotCopied'))
      }
    }

    return () => (
      <li
        ref={row}
        class={[
          c('chat-bubble-row'),
          props.message.mine ? c('chat-bubble-mine') : c('chat-bubble-theirs'),
          props.message.transfer ? c('chat-bubble-transfer') : '',
          greeting.value || transferPicture.value ? c('chat-bubble-greeting') : '',
          face.value ? c('chat-bubble-in-group') : '',
          props.searchCurrent ? c('is-search-current') : '',
          menuOpen.value ? c('has-menu') : '',
          props.editing ? c('is-editing') : '',
          props.answering ? c('is-answered') : '',
          props.shown ? c('is-shown') : '',
        ]}
        style={
          face.value
            ? ({ '--chat-bubble-face': `${faceSize.value}px` } as CSSProperties)
            : undefined
        }
        data-test='chat-bubble'
      >
        {/* One message, one list item: the thread is a list (ChatThread). Own messages on the
            right, the other person's on the left (E-014); in a conversation of two there is no
            face at the bubble -- whose it is, the side says. (Inside the item, not above it: a
            comment beside the root would make two roots in development.)

            In a group (P5) the side no longer says who: somebody else's message has their face at
            its left and their name over it -- over the first of a run of theirs, as messengers do,
            the bubbles after it in line with it (the mockup). On a phone the face stands in the line
            of the name, over the bubble (Bernd, 16.11.2026). The name is for the eye: the ear hears
            it inside the bubble, as in a thread of two. */}
        {face.value && props.showWriter ? (
          <>
            <AppAvatar
              class={c('chat-bubble-face')}
              size={faceSize.value}
              color='#fff'
              {...face.value}
              data-test='chat-bubble-face'
            />
            {/* The name leads to the writer (E-053): their contact window where they are a contact, else
                the send form -- the page decides. A control of its own beside the face, which opens
                their picture; heard as the button it is, so the bubble below leaves the name out. */}
            <div class={c('chat-bubble-writer')} data-test='chat-bubble-group-writer'>
              <Name
                linkedUser={groupWriter.value}
                withCommunity={false}
                onOpen={(user: unknown) => emit('openMember', user)}
              />
            </div>
          </>
        ) : null}
        {/* An announcement (E-050 F5): it went to everybody by mail, or could have -- marked for all
            who read it, as in the mockup. Read out before the message it belongs to. */}
        {announced.value ? (
          <div class={c('chat-bubble-announcement')} data-test='chat-bubble-announcement'>
            {t('chatGroup.announcement')}
          </div>
        ) : null}
        {/* A tap on the message opens its menu on a phone (E-059 F1); a link, a picture, a button
            in it do what they do, and a word held to mark it stays marked. On a computer the sign
            beside it opens the menu. */}
        <div class={[c('chat-bubble'), image.value ? c('has-image') : '']} onClick={tapBubble}>
          {/* ⛔ The side is the ONLY thing that says who wrote a message, and a screen reader
              does not see sides. So the writer is named in words, for the ear only. */}
          {!writerLinked.value ? (
            <span class='visually-hidden' data-test='chat-bubble-writer'>
              {writer.value}
            </span>
          ) : null}
          {/* A copy forwarded from another conversation (E-059 F2): who wrote its words first,
              before everything else in it -- a screen reader hears it first too. The name through
              <i18n-t> with a slot, as ShowFriendsTile has it: the ten languages put it in different
              places (Turkish first), and a slot keeps it text, escaped as any interpolation. A box
              of its own in the line: where the line is too narrow, the name moves to the next line
              whole, instead of breaking at its hyphen ("Carla-" over "Sonne" at 320 px). */}
          {props.message.forwarded ? (
            <div class={c('chat-bubble-forwarded')} data-test='chat-bubble-forwarded'>
              <IMdiShare class={c('chat-bubble-forwarded-icon')} aria-hidden='true' />
              {forwardedName.value ? (
                <I18nText keypath='chatThread.forwardedFrom' tag='span' scope='global'>
                  {{
                    name: () => (
                      <span
                        class={c('chat-bubble-forwarded-name')}
                        data-test='chat-bubble-forwarded-name'
                      >
                        {forwardedName.value}
                      </span>
                    ),
                  }}
                </I18nText>
              ) : (
                <span>{t('chatThread.forwarded')}</span>
              )}
            </div>
          ) : null}
          {/* The message this one answers (Bernd, 09.10.2026), quoted over it: who wrote it and the
              beginning of its words, each on one line -- a picture named, not shown. A button: a
              press goes to the quoted message in the thread. The ear hears "Antwort auf" first, so
              the name and the words after it are not taken for the message's own. */}
          {quote.value ? (
            <button
              type='button'
              class={c('chat-bubble-quote')}
              data-test='chat-bubble-quote'
              onClick={withModifiers(() => emit('showQuoted', props.message.replyTo), ['stop'])}
            >
              <span class='visually-hidden'>{t('chatThread.quoteLead')}</span>
              {quote.value.name ? (
                <span class={c('chat-bubble-quote-name')} data-test='chat-bubble-quote-name'>
                  {quote.value.name}
                </span>
              ) : null}
              <span class={c('chat-bubble-quote-text')} data-test='chat-bubble-quote-text'>
                {quote.value.hasImage ? (
                  <IMdiImageOutline class={c('chat-bubble-quote-icon')} aria-hidden='true' />
                ) : null}{' '}
                {quote.value.text || t('chatThread.imageReady')}
              </span>
            </button>
          ) : null}
          {/* The picture a message carries (P7), on top; its caption is the text under it, in the
              same bubble (E-044 F3). One a message. */}
          {image.value ? (
            <ChatBubbleImage
              image={image.value}
              onOpen={(opener: HTMLElement) =>
                emit('openImage', { message: props.message, image: image.value, opener })
              }
            />
          ) : null}
          {/* The subject a message sent from the e-mail form carries, bold over the text; a
              message without one has no line for it at all, not an empty one (E-013). A transfer
              between the two (ChatThread) has the mail's words there, behind the coin. */}
          {props.message.subject ? (
            <div
              class={[
                c('chat-bubble-subject'),
                props.message.transfer ? c('chat-bubble-transfer-head') : '',
              ]}
              data-test='chat-bubble-subject'
            >
              {/* The coin's own class in the module's spelling: the rule for it stands in the
                  bubble's stylesheet. */}
              {props.message.transfer ? (
                <ChatTransferCoin class={classes['chat-transfer-coin']} />
              ) : null}
              <ChatSearchText text={props.message.subject} />
            </div>
          ) : null}
          {/* The booking of an accepted thank-you greeting (ZE-019, Bernd, 02.10.2026): under the
              head its motif, its first line in handwriting, and the words -- the memo without that
              line, drawn as a memo is. A greeting of a line alone has no words, and no empty block.
              An <img> and no button: it opens nothing. Its room stands before the file has come,
              so nothing under it moves when it does. What somebody else wrote stands as text. */}
          {greeting.value ? (
            <>
              {/* A photo of the sender's own in the place of a motif: its small rendition, which the
                  two members of the booking may have -- asked for by the id of the link once the
                  bubble is in sight. In the same room, and no button either. */}
              {hasPhoto.value ? (
                <div
                  class={c('chat-bubble-greeting-picture')}
                  data-test='chat-bubble-greeting-photo'
                >
                  <ThankYouGreetingPhoto
                    class={c('chat-bubble-greeting-photo')}
                    linkId={props.message.linkId ?? null}
                    alt={t('thank-you-greeting.photo-of', {
                      name: props.message.greetingSender ?? props.alias,
                    })}
                    saysMissing
                  />
                </div>
              ) : motif.value ? (
                <div class={c('chat-bubble-greeting-picture')}>
                  <img
                    src={motif.value.src}
                    alt={motif.value.name}
                    width={THANK_YOU_MOTIF_WIDTH}
                    height={THANK_YOU_MOTIF_HEIGHT}
                    data-test='chat-bubble-greeting-motif'
                  />
                </div>
              ) : null}
              {parts.value.line ? (
                <div
                  class={[c('chat-bubble-greeting-line'), byHand.value ? c('is-by-hand') : '']}
                  data-test='chat-bubble-greeting-line'
                >
                  <ChatSearchText text={parts.value.line} />
                </div>
              ) : null}
              {parts.value.words ? (
                <MemoText class={c('chat-bubble-text')} memo={parts.value.words} />
              ) : null}
            </>
          ) : transferPicture.value ? (
            // A transfer the sender added a picture to (ZE-016): under the head the picture, under
            // it the memo -- the shape of a greeting's booking without the line in handwriting. In
            // the same room, and no button either. A photo is asked for by the id of the BOOKING
            // once the bubble is in sight.
            <>
              {transferPicture.value.photo ? (
                <div
                  class={c('chat-bubble-greeting-picture')}
                  data-test='chat-bubble-transfer-photo'
                >
                  <ThankYouGreetingPhoto
                    class={c('chat-bubble-greeting-photo')}
                    transactionId={props.message.transactionId ?? null}
                    alt={t('thank-you-greeting.photo-of', {
                      name: props.message.greetingSender ?? props.alias,
                    })}
                    saysMissing
                  />
                </div>
              ) : (
                <div class={c('chat-bubble-greeting-picture')}>
                  <img
                    src={transferPicture.value.motif.src}
                    alt={transferPicture.value.motif.name}
                    width={THANK_YOU_MOTIF_WIDTH}
                    height={THANK_YOU_MOTIF_HEIGHT}
                    data-test='chat-bubble-transfer-motif'
                  />
                </div>
              )}
              <MemoText class={c('chat-bubble-text')} memo={props.message.body as string} />
            </>
          ) : props.message.transfer ? (
            // A transfer's memo as the booking list shows it (MemoText): its addresses as links, its
            // stars as stars -- it is the booking's text, not a chat message.
            <MemoText class={c('chat-bubble-text')} memo={props.message.body as string} />
          ) : props.message.body ? (
            // A picture without words has no caption, and no empty line for one.
            <ChatMessageText class={c('chat-bubble-text')} text={props.message.body} />
          ) : null}
          {/* A planned video call (V5b, Bernd, 27.09.2026): offered to the member's calendar, on
              either side of the conversation -- the time comes out of the invitation's own address
              (chatVideoPlannedCall), and the calendar shows it in this member's time zone. */}
          {/* And under every video invitation "Duplizieren" (Bernd, 30.09.2026, E-058): the same room
              and topic in the question before a call, a planned one a week on -- for everybody in
              the conversation, as the link is. Beside "In den Kalender" where there is one. */}
          {plannedCall.value || videoInvitation.value ? (
            <div class={c('chat-bubble-calendar')}>
              {plannedCall.value ? (
                <button
                  type='button'
                  class={c('chat-bubble-calendar-add')}
                  data-test='chat-bubble-calendar'
                  onClick={addToCalendar}
                >
                  <IMdiCalendarPlusOutline aria-hidden='true' />{' '}
                  {t('chatThread.videoAddToCalendar')}
                </button>
              ) : null}
              {videoInvitation.value ? (
                <button
                  type='button'
                  class={c('chat-bubble-calendar-add')}
                  aria-label={t('chatThread.videoDuplicateLabel', {
                    topic: videoInvitation.value.topic,
                  })}
                  data-test='chat-bubble-duplicate'
                  onClick={() => emit('duplicateVideo', videoInvitation.value)}
                >
                  <IMdiContentDuplicate aria-hidden='true' /> {t('chatThread.videoDuplicate')}
                </button>
              ) : null}
            </div>
          ) : null}
          {/* Half an hour after a video call began, a quiet suggestion to thank the other person for it
              (W2 of the waves of gratitude; the thread decides when, utils/thanksNudge): under the
              invitation, where the occasion stands. Whoever went into the call from this wallet sees
              it -- the one who invited, and the one invited half an hour after their own click on the
              link (E-043 C, utils/chatVideoJoined). In a group's thread "Jemandem danken" opens the
              members to choose from (Bernd, 28.10.2026). */}
          {props.thanksAfterCall ? (
            <ThanksNudge
              ref={thanksLine}
              question={thanksQuestion.value}
              yes={props.thanksMembers ? t('thanksNudge.someone') : t('thanksNudge.say')}
              no={t('thanksNudge.notNow')}
              choices={choosingThanks.value ? props.thanksMembers : null}
              onYes={thankFor}
              onChoose={thankMember}
              onNo={dismissThanks}
            />
          ) : null}
          <div class={c('chat-bubble-meta')}>
            {/* The reactions to the message (Bernd, 11.10.2026): each emoji once, with how many
                reacted where it is more than one, one's own set apart -- at the left end of the
                foot line, in its height. ⛔ In the line that is there already, not in one of their
                own under the bubble: a reaction arrives with the beat, at any time, and a new line
                would move every message below it under a reading eye or a finger. Not buttons:
                what is set here is set in the menu, where one's own is the pressed one.

                For the ear a lead, and then each reaction in ONE piece (`reactionSaid`): the emoji,
                which says its own name, how many, and that it is one's own -- what the eye gets is
                left out for it. In three pieces a reader stopped three times at each, and "3, yours"
                could be heard with the emoji before it or with the one after. */}
            {reactions.value.length > 0 ? (
              <span class={c('chat-bubble-reactions')} data-test='chat-bubble-reactions'>
                <span class='visually-hidden'>{t('chatThread.reactionsLead')}</span>
                {reactions.value.map((reaction) => (
                  <span
                    key={reaction.emoji}
                    class={[c('chat-bubble-reaction'), reaction.mine ? c('is-mine') : '']}
                    data-test='chat-bubble-reaction'
                  >
                    <span class={c('chat-bubble-reaction-emoji')} aria-hidden='true'>
                      {reaction.emoji}
                    </span>
                    {reaction.count > 1 ? (
                      <span
                        class={c('chat-bubble-reaction-count')}
                        aria-hidden='true'
                        data-test='chat-bubble-reaction-count'
                      >
                        {reaction.count}
                      </span>
                    ) : null}
                    <span class='visually-hidden' data-test='chat-bubble-reaction-said'>
                      {reactionSaid(reaction)}
                    </span>
                  </span>
                ))}
              </span>
            ) : null}
            {/* Shown to the sender only, on their own message: a mail about it went out too
                (E-034). Where it did not because the recipient muted the conversation, the line
                under the bubble says so instead (`notMailed`). */}
            {mailed.value ? (
              <span
                class={c('chat-bubble-mailed')}
                role='img'
                aria-label={mailedWords.value}
                title={mailedWords.value}
                data-test='chat-bubble-mailed'
              >
                <IMdiEmailOutline aria-hidden='true' />
              </span>
            ) : null}
            {/* Its writer changed the text since (E-060): the word, before the time -- for
                everybody who reads the message. The earlier text is not kept. */}
            {props.message.editedAt ? (
              <span class={c('chat-bubble-edited')} data-test='chat-bubble-edited'>
                {t('chatThread.edited')}
              </span>
            ) : null}
            {/* When it arrived on THIS server; there is no other clock in a conversation
                (E-018). */}
            <time
              class={c('chat-bubble-time')}
              datetime={arrivedIso.value}
              data-test='chat-bubble-time'
            >
              {d(arrived.value, 'time')}
            </time>
            {/* The ticks (Chat E-093): one where the other member has not read the message yet, two
                where they have -- behind the time, on one's own message of a conversation of two.
                The thread decides which (`receipt`). Not beside a word that says the message has not
                arrived. The two signs share one box: when one tick becomes two, nothing moves. */}
            {props.receipt && !stateWord.value ? (
              <span
                class={c('chat-bubble-receipt')}
                role='img'
                aria-label={receiptWords.value}
                title={receiptWords.value}
                data-test='chat-bubble-receipt'
              >
                {props.receipt === RECEIPT_READ ? (
                  <IMdiCheckAll aria-hidden='true' />
                ) : (
                  <IMdiCheck aria-hidden='true' />
                )}
              </span>
            ) : null}
          </div>
          {/* "Options for this message" (E-059 F1): beside the bubble while the pointer is over the
              message or the keyboard is on it; on a phone out of sight, for the ear -- the tap on the
              message is the way there. */}
          {hasMenu.value ? (
            <button
              ref={more}
              type='button'
              class={c('chat-bubble-more')}
              aria-label={t('chatThread.menuMore')}
              title={t('chatThread.menuMore')}
              aria-haspopup='true'
              aria-expanded={menuOpen.value ? 'true' : 'false'}
              data-test='chat-bubble-more'
              onClick={withModifiers(toggleMenu, ['stop'])}
            >
              <IMdiDotsHorizontal aria-hidden='true' />
            </button>
          ) : null}
        </div>
        {menuOpen.value ? (
          <ChatMessageMenu
            class={{ 'is-hung': menuSpot.value !== null }}
            style={menuStyle.value}
            mine={props.message.mine}
            below={menuBelow.value}
            canReply={canReply.value}
            canEdit={canEdit.value}
            video={editsAsVideo.value}
            canForward={canForward.value}
            canCopy={canCopy.value}
            canReact={reacts.value}
            ownReaction={ownReaction.value}
            reacting={props.reactionUnderway}
            onReply={reply}
            onEdit={edit}
            onForward={forward}
            onCopy={copyText}
            onReact={react}
            onResized={settleMenu}
            onKeydown={withKeys(
              withModifiers(() => closeMenu({ focusMore: true }), ['stop', 'prevent']),
              ['esc'],
            )}
          />
        ) : null}
        {/* ⛔ Only where something is not as it should be. "Delivered" under every message of
            one's own would be the same word a hundred times over; the exception is the
            information. */}
        {stateWord.value ? (
          <div class={c('chat-bubble-state')} data-test='chat-bubble-state'>
            {stateWord.value}
          </div>
        ) : null}
        {/* No mail, and why (E-034, A2): the sender asked for one and the recipient has muted the
            conversation. A sentence, not a sign -- in the list item, so a screen reader reads it
            with the message it belongs to. */}
        {notMailed.value ? (
          <div class={c('chat-bubble-not-mailed')} data-test='chat-bubble-not-mailed'>
            {notMailed.value}
          </div>
        ) : null}
      </li>
    )
  },
})
