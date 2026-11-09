// AI-GENERATED — not an architecture reference
/**
 * One contact, opened from wherever a contact stands: the list, the column, the strip.
 *
 * One window per LIST rather than one per row -- a modal per row would build one hidden
 * dialog for every person on screen, which is the reason the heart's own confirmation is
 * `lazy`.
 */
import { useMutation } from '@vue/apollo-composable'
import { BModal } from 'bootstrap-vue-next'
import { computed, defineComponent, onBeforeUnmount, type PropType, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatForwardDialog from '@/components/Chat/ChatForwardDialog.vue'
import ChatNote from '@/components/Chat/ChatNote.vue'
import ChatSearchBar from '@/components/Chat/ChatSearchBar.vue'
import ChatThread from '@/components/Chat/ChatThread.vue'
import ChatVideoCall from '@/components/Chat/ChatVideoCall.vue'
import ChatWindowSizeToggle from '@/components/Chat/ChatWindowSizeToggle.vue'
import {
  CONTACT_META_SEPARATOR,
  type Contact,
  contactBookingsMeta,
  contactDisplay,
  contactOriginLine,
} from '@/components/Contacts/contactDisplay'
import FavoriteHeart from '@/components/FavoriteHeart.vue'
import { useChatWindowNote } from '@/composables/useChatWindowNote'
import { useChatWindowSearch } from '@/composables/useChatWindowSearch'
import { useChatWindowSize } from '@/composables/useChatWindowSize'
import { useContactOnMap } from '@/composables/useContactOnMap'
import { useSendReturn } from '@/composables/useSendReturn'
import { useAppToast } from '@/composables/useToast'
import { setChatConversationMuted } from '@/graphql/chat.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import { bookingsWithMemberRoute } from '@/utils/bookingsRoute'
import { chatMemberKey } from '@/utils/chatMemberKey'
import { CHAT_VIDEO_JOIN, CHAT_VIDEO_JOINED } from '@/utils/chatVideoApp'
import { noteChatVideoJoined } from '@/utils/chatVideoJoined'
import { gradidoAddress } from '@/utils/gradidoAddress'
import { SEND_TYPES } from '@/utils/sendTypes'
import IBiX from '~icons/bi/x'
import MdiBellOffOutline from '~icons/mdi/bell-off-outline'
import MdiBellOutline from '~icons/mdi/bell-outline'
import MdiMagnify from '~icons/mdi/magnify'
import MdiMapMarkerOutline from '~icons/mdi/map-marker-outline'
import MdiNoteText from '~icons/mdi/note-text'
import MdiNoteTextOutline from '~icons/mdi/note-text-outline'
import MdiVideoOutline from '~icons/mdi/video-outline'
import classes from './ContactWindow.module.scss'

/** What the thread has learned about the conversation (`ChatThread`, event `chatConversation`). */
type ChatConversation = { exists: boolean; mutedByMe: boolean }

/** The classes the send row is set closer with, in the order they are tried (`fitSendRow`). */
const SEND_ROW_STEPS = ['is-tight', 'is-tighter'] as const

/**
 * A state class in both spellings: the plain name, which the specs and `fitSendRow` read, and
 * the module's, which carries the rule.
 */
const stateClass = (name: string) => [name, classes[name]]

export const ContactWindow = defineComponent({
  name: 'ContactWindow',
  props: {
    modelValue: { type: Boolean, default: false },
    /** What contactListQuery delivers: `{ user, firstAt, lastAt, bookings }`. */
    contact: { type: Object as PropType<Contact | null>, default: null },
    /**
     * Opened from a group (E-055): "Hallo …" stands in the field while the two have no
     * conversation yet -- a first word is one tap on the arrow.
     */
    greet: { type: Boolean, default: false },
    /**
     * Opened from a group for somebody who is no contact yet (E-055): the window's first form,
     * only the text, until the first message makes them a contact.
     */
    firstContact: { type: Boolean, default: false },
  },
  /**
   * `contactMade`: the window's first form found a conversation -- the first message went out,
   * or one was there already -- so the person is a contact now; the page puts the server's row in.
   */
  emits: ['update:modelValue', 'contactMade'],
  setup(props, { emit }) {
    const { t, d } = useI18n()
    const router = useRouter()
    const store = useWalletStore()
    const { toastSuccess, toastError } = useAppToast()
    const { mutate: saveMuted } = useMutation(setChatConversationMuted)

    const setOpen = (open: boolean) => emit('update:modelValue', open)
    const close = () => emit('update:modelValue', false)

    /**
     * Name and face through the shared helper, not by hand.
     *
     * ⛔ This file used to rebuild both itself while `contactDisplay`'s own docstring named the
     * window as one of the three places it keeps in step -- a guarantee that was not in force,
     * and the kind of sentence that stops the next reader looking.
     */
    const display = computed(() =>
      props.contact ? contactDisplay(props.contact, { zoomable: true }) : null,
    )
    const alias = computed(() => display.value?.alias ?? '')
    const avatar = computed(() => display.value?.avatar ?? {})

    /**
     * Which person the thread belongs to -- the pair (KF-004), in lower case, as the server
     * compares it, and a missing community written as this community's own (LOG-036).
     *
     * ⛔ That last part is what keeps the thread standing while `openMember` fills the window in:
     * the booking row names the member without a community, the lookup for the figures brings the
     * uuid a moment later, and it is the same person both times -- the server reads null as this
     * community. A key that wrote the two differently made a new thread under a reading eye, and
     * dropped an answer about the bell that was on its way.
     */
    const threadKey = computed(() => chatMemberKey(props.contact?.user, store.communityUuid))

    /** The search in the conversation (E-057, useChatWindowSearch): closed with the window, and anew for another person. */
    const {
      searchOpen,
      searchTyped,
      searchFound,
      searchToggle,
      toggleSearch,
      closeSearch,
      takeFound,
    } = useChatWindowSearch(
      () => props.modelValue,
      () => threadKey.value,
    )

    /**
     * The member's own note on this person (useChatWindowNote): asked for whenever the window
     * opens on somebody, closed with the window, and anew for another person. The pair as the
     * heart names it, a member of this community with this community's uuid (as chatMemberKey
     * reads them).
     */
    const {
      noteOpen,
      noteText,
      noteStatus,
      noteReady,
      hasNote,
      noteToggle,
      typeNote,
      retryNote,
      toggleNote,
      closeNote,
    } = useChatWindowNote(
      () => props.modelValue,
      () => {
        const user = props.contact?.user
        if (!user?.gradidoID) {
          return null
        }
        return {
          member: {
            gradidoID: user.gradidoID,
            communityUuid: user.communityUuid ?? store.communityUuid ?? null,
          },
        }
      },
    )
    /** Note and search take turns: the one that opens closes the other. */
    const toggleNoteHere = () => {
      if (!noteOpen.value) {
        closeSearch({ focus: false })
      }
      toggleNote()
    }
    const toggleSearchHere = () => {
      if (!searchOpen.value) {
        closeNote({ focus: false })
      }
      toggleSearch()
    }

    /**
     * Whether the window stands large (E-077, useChatWindowSize): the switch beside the magnifier
     * turns it, for every chat window of the page, and the member's device remembers it.
     */
    const { large } = useChatWindowSize()

    /**
     * The member's address, and only where this wallet is the one that can name the host.
     *
     * ⛔ `homeCommunity` from the server, not a comparison made here. The wallet knows its own
     * community by a name out of its OWN configuration, while the name on a contact was
     * written from the backend's -- two variables in two deployments, agreeing by coincidence
     * and parting company silently. The server compares community uuids, which is the one
     * identity both sides of a federated booking agree on.
     *
     * For anybody else the line falls away rather than inventing a host: an address that
     * resolves to the wrong person is exactly what `gradidoAddress` exists to prevent.
     */
    const address = computed(() => {
      if (!props.contact?.homeCommunity) {
        return ''
      }
      return gradidoAddress(alias.value).display
    })

    /**
     * Whether the figures behind the meta line are known.
     *
     * A contact out of `contactListQuery` always carries them; a member handed straight off a
     * booking row does not, until the lookup answers. Asked of all three, not of `bookings`
     * alone, because the line is built from all three and one missing date is enough to print
     * "Invalid Date" into it.
     */
    const counted = computed(
      () =>
        props.contact?.bookings != null &&
        Boolean(props.contact?.firstAt) &&
        Boolean(props.contact?.lastAt),
    )

    /** Since when -- plain text, it leads nowhere. */
    const metaSince = computed(() =>
      counted.value && props.contact
        ? t('contacts.since', { date: d(new Date(props.contact.firstAt), 'monthAndYear') })
        : '',
    )

    /**
     * Whether there is a booking list to lead to at all.
     *
     * ⛔ Asked separately from `counted`, which only says the figures have ARRIVED. A contact
     * off the referral trace alone has arrived figures AND a count of zero, and a link over
     * that count would open a list with nothing in it.
     */
    const hasBookings = computed(() => counted.value && (props.contact?.bookings ?? 0) > 0)

    /** How many and how recently -- the part that leads to those bookings; the row's line. */
    const metaBookings = computed(() =>
      counted.value && props.contact ? contactBookingsMeta(props.contact, { t, d }) : '',
    )

    /**
     * What made the two of them contacts, where it was not a booking.
     *
     * Not behind `counted`: the origin travels with the row and does not have to wait for the
     * figures. Where both are there both lines are shown -- somebody who came here over this
     * member and has since sent them Gradido is one contact with a count and an origin.
     */
    const originLine = computed(() =>
      props.contact ? contactOriginLine(props.contact, { t }) : '',
    )

    /**
     * The booking list, narrowed to this member. Built by the same module the transactions
     * page reads the address with (utils/bookingsRoute.js) -- the two ends cannot drift.
     */
    const bookingsRoute = computed(() => bookingsWithMemberRoute(props.contact?.user))

    /**
     * The window closes on the way, as it does for the send form: the list this window sits
     * over may be the column beside the bookings page, which stays mounted across the
     * navigation.
     *
     * ⛔ Only when the click DOES navigate here. Vue runs RouterLink's own handler first, and
     * that one calls preventDefault exactly when it navigates in this tab -- a cmd or middle
     * click opens a new tab instead and leaves the event alone. Closing on those left the
     * member in a tab whose window had vanished for nothing.
     */
    const closeWhenNavigating = (event: MouseEvent) => {
      if (event.defaultPrevented) {
        close()
      }
    }

    /**
     * The button: the send form with this person already named, as the profile window on the map
     * opens it. The e-mail with a subject is the form's other tab (E-031). And "Danke sagen" under
     * a video call of the member's own in the thread (W2), which leads to the same place.
     *
     * ⚠️ A member of another community goes down the same road: the send form is what knows
     * the federation branch, and a second way of reaching it here would be a second place for
     * that knowledge to drift.
     *
     * The form's "Zurück" leads back into this conversation (E-043): the window hands its place
     * over (useSendReturn) -- the address the reply button of a chat mail has (P4c), which opens
     * the conversation on the contacts page. Where the form is not reached, it is taken back.
     */
    const sendReturn = useSendReturn()
    const toSend = async () => {
      const community = props.contact?.user?.communityUuid
      const user = props.contact?.user?.gradidoID
      if (!community || !user) {
        return
      }
      close()
      const to = `/send/${community}/${user}`
      const handed = sendReturn.put({
        to,
        back: { path: '/contacts', query: { with: user, community } },
      })
      let reached = false
      try {
        // ⛔ The mode is named although there is only this one way left. This window stands
        // beside /send, so a tap here changes only the params and the query -- the form is
        // patched, not rebuilt -- and without `art` a form that was already in e-mail mode would
        // stay there.
        const failure = await router.push({ path: to, query: { art: SEND_TYPES.send } })
        reached = !failure
      } finally {
        if (!reached) {
          sendReturn.drop(handed)
        }
      }
    }

    /**
     * The pin: whether this person stands on the find map, and the way there (Bernd, 09.10.2026).
     * `onMap` is the pair the map is asked to show, once the GMS has said the person is there
     * (useContactOnMap) -- nothing before that, and nothing for a member who may not open the map.
     */
    const { onMap, ask: askOnMap } = useContactOnMap()

    /** The pin's name: what a tap on it shows, and whom. */
    const mapName = computed(() => t('contacts.showOnMap', { name: alias.value }))

    /**
     * The map, with this person named in its address the way the contacts page is asked for a
     * conversation (`with`, `community`): the map marks them and leads back here with the same
     * pair. The window closes on the way, as for the send form -- the list it sits over may stay
     * mounted.
     */
    const toMap = () => {
      const pair = onMap.value
      if (!pair) {
        return
      }
      close()
      router.push({
        path: '/matching/karte',
        query: { with: pair.gradidoID, community: pair.communityUuid },
      })
    }

    /** Nothing is known before the thread has said what it knows: no bell and no camera until then. */
    const chatConversation = ref<ChatConversation>({ exists: false, mutedByMe: false })

    /**
     * Whether the thread has said what it knows. The event comes only then (`known` in the
     * thread), so this is true from the first event on -- also where there is no conversation
     * yet, which is what the camera needs and the bell does not.
     */
    const chatConversationKnown = ref(false)

    /** The bell's state: one's own mark on this conversation, as the member switched it last. */
    const muted = ref(false)

    const takeChatConversation = ({ exists, mutedByMe }: ChatConversation) => {
      const before = chatConversation.value.exists
      chatConversationKnown.value = true
      chatConversation.value = { exists, mutedByMe }
      muted.value = mutedByMe
      if (props.firstContact && exists && !before) {
        emit('contactMade')
      }
    }

    /**
     * The window's first form (Bernd, 30.09.2026, E-055): somebody met in a group who is no
     * contact yet, and no conversation between the two. Only the text is offered -- no Gradido,
     * no camera, no bell, no heart, no paperclip --, and "Hallo …" stands in the field: the first
     * message goes by mail as every first one does (E-024) and makes them a contact. With it the
     * whole window is there, without closing: the row comes in, the paperclip too, and the page
     * puts the server's contact row in (`contactMade`).
     */
    const firstForm = computed(() => props.firstContact && !chatConversation.value.exists)

    // Asked when the window opens on a person, and anew for another one -- the pair the thread is
    // keyed by, so a community the lookup fills in later is no other person and no second
    // question. A closed window knows nobody: what was said about the last person is let go with
    // it. Not in the window's first form (E-055): the row the pin stands in comes with the first
    // message, and with it the question.
    watch(
      () =>
        props.modelValue && props.contact?.user?.gradidoID && !firstForm.value
          ? threadKey.value
          : '',
      (person) => askOnMap(person ? props.contact?.user : null),
      { immediate: true },
    )

    /** "Hallo …", where the window was opened from a group; the thread puts it in an empty field. */
    const greeting = computed(() =>
      props.greet ? t('chatThread.firstContactGreeting', { name: alias.value }) : '',
    )

    /** Nothing known about a conversation: the window came to another person. */
    const forgetChatConversation = () => {
      chatConversationKnown.value = false
      chatConversation.value = { exists: false, mutedByMe: false }
      muted.value = false
    }

    /**
     * Counted up with every conversation the window comes to. The window stays while the person
     * in it changes (only the thread is made anew), so an answer about the bell that comes back
     * after the window moved to someone else is about someone else: it changes nothing here and
     * holds up nothing here (coderabbit, PR #3974).
     */
    let contactGeneration = 0
    let mutingInFlight = false

    /** The thread in this window: a video invitation goes out through it (`deliver`). */
    const thread = ref<InstanceType<typeof ChatThread> | null>(null)
    /** The questions of a video call (ChatVideoCall): the camera asks one, a link in the thread the other. */
    const videoCall = ref<InstanceType<typeof ChatVideoCall> | null>(null)

    // Another conversation -- the pair the thread is keyed by (`threadKey`), so the same id in
    // another community is another one: nothing of the last one's bell stays up while the new
    // thread is asking, and a question about a call with the last one is let go (it would now
    // read the new one's name). The community the lookup fills in later is no other key (see
    // `threadKey`), so an answer on its way about this person's bell still lands here.
    // ⚠️ A window that only closed (useContactWindow lets the contact go) is no other person:
    // the answer on its way still says what became of the person just seen.
    watch(
      () => threadKey.value,
      () => {
        forgetChatConversation()
        videoCall.value?.letGo()
        if (!props.contact?.user?.gradidoID) {
          return
        }
        contactGeneration += 1
        mutingInFlight = false
      },
    )

    const bellName = computed(() =>
      muted.value
        ? t('chatThread.muteOff', { name: alias.value })
        : t('chatThread.muteOn', { name: alias.value }),
    )

    /** The pair the thread asks with (KF-004): a missing community is this one. */
    const memberRef = computed(() => ({
      gradidoID: props.contact?.user?.gradidoID,
      communityUuid: props.contact?.user?.communityUuid ?? null,
    }))

    /**
     * Switched on this device first and confirmed by the server after, put back where it fails
     * -- as the heart does it. What it means is said once, as a hint, in both directions (E-031).
     *
     * ⚠️ `false` from the server is no error but no change either: there was no conversation to
     * mark (it can only happen where one vanished while the window stood open). The bell goes
     * back and says nothing -- a hint would claim a change that did not happen.
     */
    const toggleMute = async () => {
      if (mutingInFlight) {
        return
      }
      mutingInFlight = true
      const generation = contactGeneration
      const wanted = !muted.value
      const name = alias.value
      muted.value = wanted
      try {
        const answer = await saveMuted({ ref: memberRef.value, muted: wanted })
        if (generation !== contactGeneration) {
          return
        }
        if (answer?.data?.setChatConversationMuted) {
          // Two written-out keys, not one chosen by a condition: the i18n lint counts only keys
          // it can read, and would call both unused.
          toastSuccess(
            wanted ? t('chatThread.mutedHint', { name }) : t('chatThread.unmutedHint', { name }),
          )
        } else {
          muted.value = !wanted
        }
      } catch (error) {
        if (generation !== contactGeneration) {
          return
        }
        muted.value = !wanted
        toastError((error as Error).message)
      } finally {
        if (generation === contactGeneration) {
          mutingInFlight = false
        }
      }
    }

    /** The camera's name: what a tap on it starts, and with whom. */
    const videoCallName = computed(() => t('chatThread.videoCall', { name: alias.value }))
    const askVideoCall = () => videoCall.value?.ask()

    /**
     * A video invitation goes out through the thread, the way the compose bar's messages go --
     * one place for the cache, the status and the words for the ear. Nothing goes where there is
     * none.
     */
    const deliverThroughThread = (message: unknown) =>
      thread.value ? thread.value.deliver(message) : Promise.resolve(false)

    /**
     * A video invitation of one's own is changed through the thread as well (E-060): the thread
     * puts the changed message in the old one's place. '' where it went through, else what the
     * problem was.
     */
    const editThroughThread = (changed: unknown) =>
      thread.value ? thread.value.edit(changed) : Promise.resolve('OTHER')

    /**
     * The question before joining a call, asked by a click on the link of a video invitation in
     * the thread (ChatMessageText) -- provided here, around the thread it is asked from.
     */
    provide(CHAT_VIDEO_JOIN, (roomUrl: string, messageUuid: string) =>
      videoCall.value?.askJoin(roomUrl, messageUuid),
    )

    /**
     * The member went into the room of an invitation from this wallet (E-043 C): told by the link
     * in the thread where the browser opens the room (ChatMessageText), and by "Anruf beitreten"
     * in the question (ChatVideoCall) -- with the message the link stands in (ChatBubble). Noted
     * on this device by that invitation, where the thread reads it as one into the link's room
     * (`invitationInRoom`), for the line after the call (utils/chatVideoJoined) -- the room's
     * address itself is kept nowhere.
     */
    provide(CHAT_VIDEO_JOINED, (roomUrl: string, messageUuid: string) =>
      noteChatVideoJoined(store.gradidoID, thread.value?.invitationInRoom?.(roomUrl, messageUuid)),
    )

    /**
     * Forwarding a message of the thread (E-059): the window asks where to, in a dialog over
     * itself. Who wrote it is this window's person -- the dialog says "Du" for one's own.
     */
    const forwardOpen = ref(false)
    const forwarding = ref<object | null>(null)
    const forwardMessage = (message: object) => {
      forwarding.value = message
      forwardOpen.value = true
    }

    /**
     * The send row: the button with its word, then the marks. Where a language's word makes the
     * button so wide that the marks no longer fit beside it, the row is set closer -- a smaller
     * font, less room inside the button, the marks closer together -- only there (Bernd,
     * 26.09.2026); everywhere else the button keeps the measure of the map's button (see the
     * stylesheet). And where even set closer they do not fit -- four marks at 320px, in the
     * languages of the long words --, the button gives up its coin and the marks stand closer
     * still (Bernd, 09.10.2026): the marks stay beside the button down to 320px in all ten
     * languages.
     *
     * Measured, not decided by the language: whether it fits depends on the word in the font, on
     * the window's width and on how many marks there are (the camera and the bell come once the
     * thread has spoken). The row and its two parts are watched for their size, and the decision
     * is taken on the row's OWN measure -- the class that sets it closer is lifted for the reading
     * and put back in the same task, so nothing of that is drawn.
     *
     * ⚠️ Taken in the next frame, not in the observer's callback: shrinking the button changes the
     * row's height, and a size changed from inside the callback, at the depth it observes, is one
     * the browser reports as a loop ("ResizeObserver loop completed with undelivered
     * notifications"). A frame later it is an ordinary change. The frame falls in the dialog's
     * fade on opening; where the marks come in later, it is the frame in which they appear.
     */
    const sendRow = ref<HTMLDivElement | null>(null)
    const sendTight = ref(false)
    const sendTighter = ref(false)

    const fitSendRow = () => {
      const row = sendRow.value
      const button = row?.querySelector('.send-btn')
      const marks = row?.querySelector('.contact-window-marks')
      // Not laid out: the dialog is still hidden, or already gone.
      if (!row || !button || !marks || !row.clientWidth) {
        return
      }
      const worn = SEND_ROW_STEPS.filter((step) => row.classList.contains(step))
      // The gap is the row's own, and it changes with the step: read anew for each reading.
      const fits = () =>
        button.getBoundingClientRect().width +
          (Number.parseFloat(getComputedStyle(row).columnGap) || 0) +
          marks.getBoundingClientRect().width <=
        row.getBoundingClientRect().width
      row.classList.remove(...SEND_ROW_STEPS.flatMap(stateClass))
      const inOwnMeasure = fits()
      row.classList.add(...stateClass('is-tight'))
      const setCloser = inOwnMeasure || fits()
      row.classList.remove(...stateClass('is-tight'))
      row.classList.add(...worn.flatMap(stateClass))
      sendTight.value = !inOwnMeasure
      sendTighter.value = !setCloser
    }

    let sendRowResizes: ResizeObserver | null = null
    let sendRowFrame = 0

    watch(
      sendRow,
      (row) => {
        sendRowResizes?.disconnect()
        sendRowResizes = null
        if (!row || typeof ResizeObserver === 'undefined') {
          return
        }
        sendRowResizes = new ResizeObserver(() => {
          cancelAnimationFrame(sendRowFrame)
          sendRowFrame = requestAnimationFrame(fitSendRow)
        })
        sendRowResizes.observe(row)
        for (const part of row.children) {
          sendRowResizes.observe(part)
        }
      },
      { flush: 'post' },
    )

    onBeforeUnmount(() => {
      sendRowResizes?.disconnect()
      cancelAnimationFrame(sendRowFrame)
    })

    /* A window over the list, not a jump into the send form (KF-010). A tap on a contact is
       somebody saying "this person", and what follows is the conversation with them, with the way
       to send them Gradido under the figures (E-033).

       ⛔ Not `centered`: a window in the middle grows in both directions when the thread lands,
       and what was under a finger moves up. At the top of the screen it grows downwards only
       (E-031).

       `fullscreen='sm'`: below Bootstrap's `sm` (576 px) the window is a sheet over the whole
       screen -- the head at the top, the compose bar at the bottom, the thread in between taking
       what is left (see the stylesheet). Measured in the installed bootstrap-vue-next: a string
       gives the dialog `modal-fullscreen-${value}-down`, and the wallet's CSS has
       `.modal-fullscreen-sm-down` under `(max-width: 575.98px)`.

       ⛔ `no-header` / `no-footer`, NOT `hide-header` / `hide-footer`. bootstrap-vue-next renamed
       both; the old names are accepted silently as plain attributes and do nothing, so the window
       came up with an empty header bar and an untranslated Cancel / OK pair under its own two
       buttons. Measured in the installed package: `noHeader`/`noFooter` are declared,
       `hideHeader`/`hideFooter` occur nowhere. `UserThankYouCard.vue` carries the same warning
       beside the same trap. Written in kebab case, as the template had them: the drift spec
       (ContactWindow.modalProps.spec) reads the names off this tag and holds them against the
       installed component.

       `lazy`, like the heart's confirmation: without it a closed dialog stays rendered and
       teleported to the body -- here holding a 64px portrait and a contact.

       ⛔ And `aria-label`, BECAUSE of `no-header`. The dialog labels itself through its header --
       `aria-labelledby` is bound only where there is one -- so dropping the header left this
       window with no accessible name at all: a screen reader announced "dialog" and nothing
       else, while the person's name existed only inside the body. */
    return () => (
      <BModal
        modelValue={props.modelValue}
        fullscreen='sm'
        lazy
        no-header
        no-footer
        aria-label={alias.value}
        body-class='contact-window-body'
        dialog-class={large.value ? 'chat-window-large' : undefined}
        data-test='contact-window'
        onUpdate:modelValue={setOpen}
      >
        {props.contact ? (
          <div
            class={[
              'contact-window-inner',
              classes['contact-window-inner'],
              large.value ? stateClass('is-large') : '',
            ]}
          >
            {/* The cross at the very top, in a line of its own, and the name with its marks one
                line below it (Bernd, 24.09.2026): beside the name the cross took the room the name
                and its marks need -- on a phone the name was down to a few letters. The window
                could always be closed by clicking beside it, but that is a thing one has to know
                -- a cross is the one control everybody looks for (Bernd, 04.09.2026).

                ⛔ In the body, not by turning the header back on: BModal's header would bring a
                bar with a rule under it and its own padding.

                ⚠️ `t('form.close')` as the accessible name, not the glyph: a screen reader reading
                "times" or nothing at all is what a bare × amounts to. */}
            <div class={['contact-window-top', classes['contact-window-top']]}>
              {/* The member's own note on this person (Bernd, 27.10.2026): beside the magnifier,
                  at the row's left end. It comes with the answer to the question for the note, and
                  comes there into free room, moving nothing; with the magnifier, not in the first
                  form. Filled where there is a note: the shape says it, not a colour. */}
              {!firstForm.value && noteReady.value ? (
                <button
                  ref={noteToggle}
                  type='button'
                  class={[
                    'contact-window-note-toggle',
                    classes['contact-window-note-toggle'],
                    noteOpen.value ? stateClass('is-on') : '',
                  ]}
                  aria-label={t('chatNote.title')}
                  title={t('chatNote.title')}
                  aria-pressed={noteOpen.value ? 'true' : 'false'}
                  data-test='contact-window-note'
                  onClick={toggleNoteHere}
                >
                  {hasNote.value ? (
                    <MdiNoteText aria-hidden='true' />
                  ) : (
                    <MdiNoteTextOutline aria-hidden='true' />
                  )}
                </button>
              ) : null}
              {/* The search in the conversation (Bernd, 30.09.2026, E-057): the magnifier by the
                  cross opens the bar below it and closes it again. Not in the window's first form:
                  there is nothing to search yet. */}
              {!firstForm.value ? (
                <button
                  ref={searchToggle}
                  type='button'
                  class={[
                    'contact-window-search-toggle',
                    classes['contact-window-search-toggle'],
                    searchOpen.value ? stateClass('is-on') : '',
                  ]}
                  aria-label={t('chatSearch.open')}
                  title={t('chatSearch.open')}
                  aria-pressed={searchOpen.value ? 'true' : 'false'}
                  data-test='contact-window-search'
                  onClick={toggleSearchHere}
                >
                  <MdiMagnify aria-hidden='true' />
                </button>
              ) : null}
              {/* The window large, for a longer text, and back (Bernd, 12.10.2026, E-077).

                  ⛔ Between the magnifier and the cross, not before the magnifier. The row hangs
                  at its right end, and the magnifier comes with the thread's first word: at the
                  left end it comes into free room; behind the switch it would push the switch one
                  place to the left and stand where the switch stood, under a finger on its way to
                  it (the marks' rule, below). */}
              <ChatWindowSizeToggle />
              <button
                type='button'
                class={['contact-window-close', classes['contact-window-close']]}
                aria-label={t('form.close')}
                title={t('form.close')}
                data-test='contact-window-close'
                onClick={close}
              >
                <IBiX />
              </button>
            </div>
            {searchOpen.value ? (
              <ChatSearchBar
                modelValue={searchTyped.value}
                class={['contact-window-search', classes['contact-window-search']]}
                result={searchFound.value}
                onUpdate:modelValue={(typed: string) => {
                  searchTyped.value = typed
                }}
                onOlder={() => thread.value?.searchStep(-1)}
                onNewer={() => thread.value?.searchStep(1)}
                onClose={closeSearch}
              />
            ) : null}

            <div class={['contact-window-head', classes['contact-window-head']]}>
              <AppAvatar size={64} color='#fff' {...avatar.value} />
              <div class={['contact-window-who', classes['contact-window-who']]}>
                {/* The name has its line to itself (Bernd, 26.09.2026): the marks that stood
                    behind it went down beside the send button, where they no longer take the room
                    a long name needs on a phone. Where even the whole line is too short, the name
                    gives way (ellipsis). */}
                <div
                  class={['contact-window-name', classes['contact-window-name']]}
                  data-test='contact-window-name'
                >
                  {alias.value}
                </div>
                {props.contact.user.communityName ? (
                  <div
                    class={['contact-window-community', classes['contact-window-community']]}
                    data-test='contact-window-community'
                  >
                    {props.contact.user.communityName}
                  </div>
                ) : null}
                {/* ⛔ Only where it can be built truthfully. The address is `host/u/alias`, and
                    the host is the CONTACT's community -- which a contact row does not carry. For
                    a member of this community it is ours; for anybody else the wallet would have
                    to invent one, and an address that resolves to the wrong person is the exact
                    failure `gradidoAddress` exists to prevent. The community line above already
                    says they are from elsewhere. */}
                {address.value ? (
                  <div
                    class={['contact-window-address', classes['contact-window-address']]}
                    data-test='contact-window-address'
                  >
                    {address.value}
                  </div>
                ) : null}
              </div>
            </div>

            {/* The three numbers come from the same answer as the list: oldest booking, how many,
                newest booking.

                ⛔ Only where they are. Opened from a booking row the window stands on what that
                row carries, and a single booking knows nothing about how many there were in all
                -- the figures arrive a moment later, from the lookup useContactWindow makes
                (`openMember`). Until then the line is empty rather than guessed: `new Date(
                undefined)` prints "Invalid Date" and a plural rule handed no number throws.

                ⚠️ And the line keeps its HEIGHT while it is empty -- see the stylesheet. Letting
                it collapse moved what stands under it up by a line and then dropped it back down
                as the answer landed, under a finger already on its way there.

                ⛔ ONE link over the two figures, not one each. Narrowed to this member the newest
                booking IS the top row of the list, so "how many" and "when was the last" lead to
                the same place -- two links would have been two names for one door. "Since when"
                leads nowhere and stays plain text. (Bernd, 04.09.2026.)

                The separator carries its OWN spaces, in its own element, and nothing here relies
                on the whitespace between the elements. The spec reads the rendered text back for
                exactly that.

                Not in the window's first form (E-055): no figures can come for somebody who is no
                contact yet, and the line's reserved height would stand as an empty band under the
                head (measured). It comes with the first message, together with the row below. */}
            {!firstForm.value ? (
              <div
                class={['contact-window-meta', classes['contact-window-meta']]}
                data-test='contact-window-meta'
              >
                {counted.value ? (
                  <>
                    <span>{metaSince.value}</span>
                    {/* ⛔ Only where there are bookings. Somebody who came here over this member
                        is a contact from that moment, and the list behind this link would be
                        EMPTY -- a door onto nothing, under a number that would have read "0
                        bookings". The server agrees: narrowed to that person the booking list has
                        no rows. */}
                    {hasBookings.value ? (
                      <>
                        <span>{CONTACT_META_SEPARATOR}</span>
                        <RouterLink
                          to={bookingsRoute.value}
                          class={['contact-window-bookings', classes['contact-window-bookings']]}
                          data-test='contact-window-bookings'
                          onClick={closeWhenNavigating}
                        >
                          {metaBookings.value}
                        </RouterLink>
                      </>
                    ) : null}
                  </>
                ) : null}
                {/* What made the two of them contacts, where it was not a booking -- a quiet line
                    of its own UNDER the figures, not instead of them. A contact can have both. */}
                {originLine.value ? (
                  <div
                    class={['contact-window-origin', classes['contact-window-origin']]}
                    data-test='contact-window-origin'
                  >
                    {originLine.value}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Sending Gradido, the one way out of this window: the map profile's button
                (MatchProfile) with its word and its white coin, in the flat gold of the compose
                bar's send button instead of the map's teal (Bernd, 24.09.2026), and set smaller
                than the map's, one way among several (29.09.2026). Under the figures and above the
                line where the thread begins. No "Send e-mail" beside it: the short mail is the
                compose bar's box, the one with a subject the send form's other tab (E-031).

                `is-tight`: where a language's word makes the button so wide that the marks no
                longer fit beside it, the row is set closer, with a smaller font -- there only
                (Bernd, 26.09.2026). `is-tighter`: where even that is too wide, with four marks at
                320px in the languages of the long words, the button gives up its coin and the
                marks stand closer still (Bernd, 09.10.2026). See `fitSendRow`.

                Not in the window's first form (E-055): somebody met in a group who is no contact
                yet gets a first word, and only that -- the row comes with the first message. */}
            {!firstForm.value ? (
              <div
                ref={sendRow}
                class={[
                  'contact-window-send',
                  classes['contact-window-send'],
                  sendTight.value ? stateClass('is-tight') : '',
                  sendTighter.value ? stateClass('is-tighter') : '',
                ]}
              >
                <button
                  type='button'
                  class={['send-btn', classes['send-btn'], 'send-gradido', classes['send-gradido']]}
                  data-test='contact-window-send'
                  onClick={toSend}
                >
                  <img
                    src='/img/svg/gdd_coin_sw.svg'
                    class={['send-coin', classes['send-coin']]}
                    alt=''
                    aria-hidden='true'
                  />{' '}
                  {t('contacts.sendGradido')}
                </button>
                {/* The marks, at the right end of the button's row with an empty stretch before
                    them (Bernd, 26.09.2026): the pin, the camera, the bell, the heart -- in this
                    order. The heart at the very right, where it stands in every list; the bell
                    next to it, the two of them marks of one's own on this person that say how they
                    stand; the camera next, since it too is a way of getting in touch, and at the
                    left end, beside the camera, the pin for somebody who stands on the find map
                    (09.10.2026). Before, they stood behind the name and took a long name's room on
                    a phone.

                    ⛔ The marks hang at the right end, so one that comes later pushes everything
                    to its left one place further left. The order they stand in is therefore the
                    order they come in, read from the right: the heart at once, camera and bell
                    with the thread's first word, the pin last. Nothing that already stands there
                    moves under a finger on its way to it.

                    They keep their measure from the name line: the booking row's `gap-2` between
                    them, the heart the one of every list -- the same component, the same look, the
                    same question before it is taken away (E-030). */}
                <div
                  class={['contact-window-marks', classes['contact-window-marks']]}
                  data-test='contact-window-marks'
                >
                  {/* The pin: this person on the find map (Bernd, 09.10.2026). There only for
                      somebody who stands on the map -- a home set and "findable" -- and only for a
                      member who may open the map themselves (useContactOnMap): a way that would end
                      in "not on the map" is not offered. Beside the camera: both lead to the
                      person, the bell and the heart are marks of one's own on them. No word beside
                      it; its name says whom the map will show.

                      ⛔ At the left end, and not before the thread has spoken -- that is, never
                      before the camera: see the note on the marks above. The GMS's answer may come
                      before the thread's or after it; standing between camera and bell, the pin
                      came to stand exactly where the camera had stood a moment before, and a
                      finger on its way to a video call opened the map instead (found by the second
                      reader, 09.10.2026). */}
                  {onMap.value && chatConversationKnown.value ? (
                    <button
                      type='button'
                      class={[
                        'contact-window-mark',
                        classes['contact-window-mark'],
                        'contact-window-map',
                        classes['contact-window-map'],
                      ]}
                      aria-label={mapName.value}
                      title={mapName.value}
                      data-test='contact-window-map'
                      onClick={toMap}
                    >
                      <MdiMapMarkerOutline
                        class={['contact-window-map-icon', classes['contact-window-map-icon']]}
                        aria-hidden='true'
                      />
                    </button>
                  ) : null}
                  {/* The camera: a video call with this person (V2). A room on a checked Jitsi
                      server, whose address goes to them as an ordinary chat message. There once
                      the thread has said what it knows -- and, unlike the bell, also where there
                      is no conversation yet: a call may be how one begins (its message is then the
                      first, and goes by mail, E-024). No word beside it: the question it opens
                      carries the words. */}
                  {chatConversationKnown.value ? (
                    <button
                      type='button'
                      class={[
                        'contact-window-mark',
                        classes['contact-window-mark'],
                        'contact-window-video',
                        classes['contact-window-video'],
                      ]}
                      aria-label={videoCallName.value}
                      title={videoCallName.value}
                      data-test='contact-window-video'
                      onClick={askVideoCall}
                    >
                      <MdiVideoOutline
                        class={['contact-window-video-icon', classes['contact-window-video-icon']]}
                        aria-hidden='true'
                      />
                    </button>
                  ) : null}
                  {/* The bell: mutes this conversation for oneself -- no mails about their chat
                      messages; the thread shows them as before (E-024). A letter written with the
                      form "send an e-mail" still comes as a mail, and the hint says so (E-034,
                      A3). Only where there is a conversation: before the first message there is
                      nothing to mute, and the thread says when there is one. No question before
                      switching, in either direction: nothing is lost either way, and it switches
                      back as easily (unlike the heart, KF-003). */}
                  {chatConversation.value.exists ? (
                    <button
                      type='button'
                      class={[
                        'contact-window-mark',
                        classes['contact-window-mark'],
                        'contact-window-bell',
                        classes['contact-window-bell'],
                        muted.value ? stateClass('is-muted') : '',
                      ]}
                      aria-pressed={muted.value ? 'true' : 'false'}
                      aria-label={bellName.value}
                      title={bellName.value}
                      data-test='contact-window-bell'
                      onClick={toggleMute}
                    >
                      {muted.value ? (
                        <MdiBellOffOutline
                          class={['contact-window-bell-icon', classes['contact-window-bell-icon']]}
                          aria-hidden='true'
                        />
                      ) : (
                        <MdiBellOutline
                          class={['contact-window-bell-icon', classes['contact-window-bell-icon']]}
                          aria-hidden='true'
                        />
                      )}
                    </button>
                  ) : null}
                  <FavoriteHeart
                    class={['contact-window-heart', classes['contact-window-heart']]}
                    member={props.contact.user}
                  />
                </div>
              </div>
            ) : null}

            {/* The conversation, where "conversation history -- comes with the chat" stood
                (E-023, KF-010), with the line to write in under it (P3). There as soon as the pair
                is: opened from a booking row, before the lookup for the figures answers
                (useContactWindow.openMember). It tells the window what it learned about the
                conversation -- whether there is one, and whether it is muted -- for the bell.

                ⛔ Keyed by the pair. The thread takes its person once, when it is made; should the
                window ever be handed another person while it stands open, a new key makes a new
                thread instead of leaving one person's messages under another's name. The key goes
                in as well: it is how the thread knows this person's first message when it arrives
                in a thread that holds none yet.

                `ref`: the video call is sent through the thread (`deliver`), the way the compose
                bar's messages go -- one place for the cache, the status and the words for the ear.

                `thank`: "Danke sagen" under a video call of the member's own (W2) leads where the
                window's button does -- the send form with this person, the window closed
                (`toSend`): one way there, not a second one in the thread. */}
            {props.contact.user?.gradidoID ? (
              <ChatThread
                key={threadKey.value}
                ref={thread}
                class={[
                  'contact-window-thread',
                  classes['contact-window-thread'],
                  noteOpen.value ? stateClass('is-covered') : '',
                ]}
                member={props.contact.user}
                memberKey={threadKey.value}
                alias={alias.value}
                greeting={greeting.value}
                textOnly={firstForm.value}
                search={searchOpen.value ? searchTyped.value : ''}
                onChatConversation={takeChatConversation}
                onSearch={takeFound}
                onDuplicateVideo={(invitation: unknown) => videoCall.value?.duplicate(invitation)}
                onEditVideo={(change: unknown) => videoCall.value?.edit(change)}
                onForwardMessage={forwardMessage}
                onThank={toSend}
                v-slots={{
                  cover: () =>
                    noteOpen.value ? (
                      <ChatNote
                        modelValue={noteText.value}
                        placeholder={t('chatNote.placeholderMember', { name: alias.value })}
                        status={noteStatus.value}
                        onUpdate:modelValue={typeNote}
                        onRetry={retryNote}
                        onClose={closeNote}
                      />
                    ) : null,
                }}
              />
            ) : null}

            {/* The two questions of a video call -- starting one, and joining one from its link
                in the thread (V2 ... V5b) -- in a component of their own, since a group's window
                asks them too (E-053). This window hands over the name, whether the next message is
                the first (it goes by mail in any case, E-024), and its thread's way out. */}
            <ChatVideoCall
              ref={videoCall}
              name={alias.value}
              first={!chatConversation.value.exists}
              canMail={chatConversation.value.exists}
              deliver={deliverThroughThread}
              change={editThroughThread}
            />

            {/* Forwarding a message of this thread (E-059): the dialog that asks where to, over
                this window. Here and not on the page under it: the window is opened from the
                contacts page, the column, the strip, the booking lists and the overview's tile,
                and forwarding goes from each of them (Bernd, 01.10.2026). */}
            <ChatForwardDialog
              modelValue={forwardOpen.value}
              message={forwarding.value}
              writer={alias.value}
              onUpdate:modelValue={(open: boolean) => {
                forwardOpen.value = open
              }}
            />
          </div>
        ) : null}
      </BModal>
    )
  },
})
