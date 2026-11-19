// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { BAvatar, BCol, BCollapse, BRow } from 'bootstrap-vue-next'
import {
  type Component,
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  type PropType,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { AppAvatar } from '@/components/AppAvatar'
import { ChatReactionChoice } from '@/components/Chat/ChatReactionChoice'
import { FavoriteHeart } from '@/components/FavoriteHeart'
import type { LinkedUser, TransactionRow } from '@/components/GddTransactionList'
import { ThanksNudge } from '@/components/ThanksNudge'
import { ThankYouGreetingPhoto } from '@/components/ThankYouGreeting/ThankYouGreetingPhoto'
import MemoText from '@/components/TransactionRows/MemoText'
import { VariantIcon } from '@/components/VariantIcon'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { pollChatNow } from '@/composables/useChatUpdates'
import { useFilters } from '@/composables/useFilters'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { usePassOnDraft } from '@/composables/usePassOnDraft'
import { useThanksNudges } from '@/composables/useThanksNudges'
import { useAppToast } from '@/composables/useToast'
import {
  isTransactionReactionUnderway,
  onTransactionReaction,
  reactToTransaction,
} from '@/composables/useTransactionReactions'
import { LIST_AVATAR_SIZE } from '@/constants'
import { markTransferSeen } from '@/graphql/chat.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import { memberAlias } from '@/utils/gradidoAddress'
import { SEND_TYPES } from '@/utils/sendTypes'
import { passOnNudgeState } from '@/utils/thanksNudge'
import { THANK_YOU_MOTIF_HEIGHT, THANK_YOU_MOTIF_WIDTH } from '@/utils/thankYouMotifs'
import { transactionPictureShown } from '@/utils/transactionPicture'
import IMdiEmoticonHappyOutline from '~icons/mdi/emoticon-happy-outline'
import { DecayInformation } from '../DecayInformations/DecayInformation'
import { CollapseIcon } from '../TransactionRows/CollapseIcon'
import { Name } from '../TransactionRows/Name'
import classes from './GddTransaction.module.scss'

/** The picture of a transfer or of a thank-you greeting, as a booking names it. */
type BookingPicture = { motif: string | null; hasPicture: boolean }

/** A booking as this row reads it: the list's row, and what the list does not name of it. */
export type Booking = TransactionRow & {
  type?: string
  balanceDate?: string
  previousBalance?: string
  memo?: string | null
  linkId?: number | null
  reaction?: string | null
  canReact?: boolean | null
  greeting?: BookingPicture | null
  picture?: BookingPicture | null
  thankYouCardLabel?: string | null
  viaThankYouCard?: boolean | null
}

/** What stands where the name stands: the community of a creation, or what `Name` is handed. */
type NameProps = {
  class: string
  creationLinkedUser?: string
  amount?: string
  linkedUser?: LinkedUser | null
  linkId?: number | null
  withCommunity?: boolean
}

export const GddTransaction = defineComponent({
  name: 'GddTransaction',
  props: {
    transaction: {
      type: Object as PropType<Booking>,
      required: true,
    },
  },
  emits: ['open-member'],
  setup(props, { emit, expose }) {
    const gddTransaction = ref<HTMLElement | null>(null)

    const store = useWalletStore()
    const router = useRouter()
    const visible = ref(false)
    /** The row has been opened at least once: what only the opened row shows is made from then on. */
    const opened = ref(false)
    /** How often it has been opened: the choice of a reaction begins anew each time. */
    const openings = ref(0)
    /** When it was opened last: the moment the suggestion to pass a thank-you on goes by (W2). */
    const openedAt = ref(0)

    const toggleVisible = () => {
      visible.value = !visible.value
    }
    watch(
      visible,
      (now) => {
        if (!now) {
          return
        }
        openedAt.value = Date.now()
        opened.value = true
        openings.value += 1
        // Only once the row is set up: it starts closed, so this never runs before that.
        sayTransferSeen()
      },
      { immediate: true },
    )

    const { t, d } = useI18n()
    const { GDD } = useFilters()
    const { toastError } = useAppToast()
    // Asked for its client when an emoji is pressed, not here: the row is drawn in places that
    // hold none (and `client` throws where none is provided).
    const apollo = useApolloClient()

    /**
     * The member opened a transfer they received: it is seen (Chat E-086, Bernd, 26.10.2026: "nur
     * wenn die Transaktion geöffnet wurde") -- this one, not an older one of the same person. Said
     * once a row; then the beat asks at once, and the dot at the sender and the mark in the menu go
     * within a second. Nothing for a booking that is no transfer received from a person, and nothing
     * where no client is at hand. A failure is let go: the transfer stays unread, and the next
     * opening says it again.
     */
    let seenSaid = false
    function sayTransferSeen() {
      if (seenSaid || props.transaction.typeId !== 'RECEIVE' || !props.transaction.linkedUser) {
        return
      }
      seenSaid = true
      let asked: unknown
      try {
        asked = apollo.client.mutate({
          mutation: markTransferSeen,
          variables: { transactionId: props.transaction.id },
        })
      } catch {
        seenSaid = false
        return
      }
      Promise.resolve(asked)
        .then(() => pollChatNow())
        .catch(() => {
          seenSaid = false
        })
    }

    /**
     * The emoji the recipient of this transfer answered it with (Bernd, 11.10.2026), or null: as the
     * booking came from the server -- and as the member set it since, here or at the booking's
     * bubble in the conversation, which is said to every place that holds the booking
     * (onTransactionReaction).
     *
     * A list read again is the server's word again: by the BOOKING it hands in, not by a changed
     * value -- a booking that comes without a reaction a second time says that there is none now,
     * whatever was set here in between (it was taken back on another device).
     */
    const reaction = ref<string | null>(props.transaction.reaction ?? null)
    watch(
      () => props.transaction,
      (now) => {
        reaction.value = now.reaction ?? null
      },
    )
    const stopReactions = onTransactionReaction(
      ({ transactionId, reaction: now }: { transactionId: number; reaction: string | null }) => {
        if (transactionId === props.transaction.id) {
          reaction.value = now
        }
      },
    )
    onBeforeUnmount(stopReactions)

    /** Only the recipient reacts: on the row of what the member received, the reaction is their own. */
    const reactionMine = computed(() => props.transaction.typeId === 'RECEIVE')
    /** The reaction as it is said, in one piece: the emoji, and that it is one's own. */
    const reactionSaid = computed(() =>
      reactionMine.value ? `${reaction.value}, ${t('chatThread.reactionMine')}` : reaction.value,
    )
    /** A reaction of the member's to this booking is on its way: the emoji take no press meanwhile. */
    const reacting = computed(() => isTransactionReactionUnderway(props.transaction.id))

    /**
     * An emoji of the choice was pressed: the member's reaction, or the taking back of it where it
     * is the booking's already -- read off the reaction as this row holds it now. Where the server
     * refuses, nothing has changed, and the member is told.
     */
    const react = async (emoji: string) => {
      try {
        await reactToTransaction(
          apollo.client,
          { ...props.transaction, reaction: reaction.value },
          emoji,
        )
      } catch {
        toastError(t('chatThread.reactionFailed'))
      }
    }

    /**
     * "Dank weitergeben?" in the opened row of a thank-you received (W2 of the waves of gratitude):
     * from a person, up to seven days after it came, measured when the row was opened -- and not where
     * the member answered it on this device already (useThanksNudges, by the booking's id).
     */
    const { isSeen: thanksSeen, markSeen: markThanksSeen } = useThanksNudges()
    const passOnOffered = computed(
      () =>
        opened.value &&
        passOnNudgeState({
          // The rule names what it reads of a booking more narrowly than the list's row does.
          transaction: props.transaction as Parameters<typeof passOnNudgeState>[0]['transaction'],
          now: openedAt.value,
          seen: thanksSeen('pass-on', props.transaction.id),
        }) === 'show',
    )

    /**
     * "Jemandem danken": the send form with nobody named -- the member chooses whom. Outwards, never
     * back to the giver, so no name is offered.
     *
     * The page of the form learns which thank-you its transfer passes on: this booking, handed over
     * in memory (usePassOnDraft), the trail nobody is shown. Where the form is not reached, it is
     * taken back.
     */
    const passOnDraft = usePassOnDraft()
    const passOn = async () => {
      markThanksSeen('pass-on', props.transaction.id)
      const handed = passOnDraft.put(props.transaction.id)
      let reached = false
      try {
        const failure = await router.push({ path: '/send', query: { art: SEND_TYPES.send } })
        reached = !failure
      } finally {
        if (!reached) {
          passOnDraft.drop(handed)
        }
      }
    }

    /** The line, for where the keyboard stood in it. */
    const passOnLine = ref<InstanceType<typeof ThanksNudge> | null>(null)

    /**
     * "Nicht jetzt": the line goes, and does not come back for this thank-you. A keyboard that stood
     * on it would fall out of the page with it; it goes to the choice of a reaction above, where there
     * is one, else to the name that opens the row's person.
     */
    const notNow = async () => {
      const hadKeyboard = Boolean(passOnLine.value?.$el?.contains?.(document.activeElement))
      markThanksSeen('pass-on', props.transaction.id)
      if (!hadKeyboard) {
        return
      }
      await nextTick()
      const row = gddTransaction.value
      const next =
        row?.querySelector<HTMLElement>('.chat-reaction-choice [tabindex="0"]') ??
        row?.querySelector<HTMLElement>('.gdd-transaction-list-item-open')
      next?.focus({ preventScroll: true })
    }

    /**
     * The picture the sender added to this transfer, as the opened row shows it: `{ photo: true }`
     * or `{ motif }`, null for every other booking (utils/transactionPicture).
     */
    const transferPictureShown = computed(() =>
      transactionPictureShown(props.transaction.picture, t),
    )

    /**
     * The picture of the thank-you greeting this booking was made from, in the same two shapes; null
     * for every other booking. A greeting names its picture as a transfer does (`motif`,
     * `hasPicture`), and a booking has a greeting or a picture, never both.
     */
    const greetingShown = computed(() => transactionPictureShown(props.transaction.greeting, t))

    const pictureShown = computed(() => greetingShown.value ?? transferPictureShown.value)

    /** Whose photo it is, for the ear: whoever sent the transfer -- the member, or the other one. */
    const pictureSender = computed(() =>
      props.transaction.typeId === 'SEND'
        ? memberAlias(store.username, store.gradidoID)
        : memberAlias(props.transaction.linkedUser?.alias, props.transaction.linkedUser?.gradidoID),
    )

    // What the circle says, what colours it, and the picture if the wallet already holds one --
    // from one call, so the parts cannot come to describe different members (AS-010). The
    // letters follow the alias, because the line right beside this circle shows the alias; the
    // colour keeps following the real initials, so nobody's colour moves and the printed card
    // still agrees with the screen.
    //
    // Reading only, never fetching: the request for the whole list happens once, in
    // DashboardLayout. `linkedUser` may be null, and this is written for that.
    const memberAvatar = computed(() => memberAvatarProps(props.transaction?.linkedUser))

    const isCreationType = computed(() => {
      return props.transaction.typeId === 'CREATION'
    })

    const avatarComponent = computed<Component>(() => {
      return isCreationType.value ? BAvatar : AppAvatar
    })

    const avatarProps = computed(() => {
      // Both kinds of row stand in one list, so the gift takes the size the faces take
      // (LIST_AVATAR_SIZE -- see the constant for why 48).
      if (isCreationType.value) {
        return {
          size: LIST_AVATAR_SIZE,
          rounded: 'lg',
          variant: 'success',
        }
      } else {
        return {
          // Spread, not four hand-copied lines: `name`, `initials`, `colorSeed` and `src`
          // belong together, and the one time this house let a call site assemble such a set
          // itself, it wrote `username` -- a prop AppAvatar does not have, dropped in silence,
          // and the fallback it was meant to feed never arrived.
          ...memberAvatar.value,
          // Opens the picture at full size on a tap (AS-018). Empty for a member who has no
          // picture, so those circles stay exactly as unclickable as they were -- the helper
          // decides that, not this template.
          //
          // ⚠️ AFTER the spread on purpose. Both objects are built for this one avatar, so
          // nothing collides today; put first, a later key of the same name in
          // `memberAvatarProps` would silently take the zoom away and no test would say so.
          //
          // The label is NOT assembled here. It was, at both call sites, until a review pointed
          // out that the helper already holds the member -- and that two call-site expressions
          // are exactly how the button and the overlay come to name different people.
          ...avatarZoomBindings(props.transaction?.linkedUser, memberAvatar.value),
          color: '#fff',
          size: LIST_AVATAR_SIZE,
        }
      }
    })

    const useNameComponent = computed(() => {
      return !isCreationType.value
    })

    // The width the face takes, handed to the stylesheet so the indents below it are worked out
    // from the same number the face is drawn at.
    const faceWidth = { '--transaction-face': `${LIST_AVATAR_SIZE}px` }

    // The counterparty's community, for the line under the name. Not on a creation: that row's
    // name IS the community (NU-020).
    const communityName = computed(() =>
      isCreationType.value ? '' : (props.transaction.linkedUser?.communityName ?? ''),
    )

    // Same condition `Name` uses to make the name a link -- and the one this row uses for
    // the heart. Held in one place so the two cannot drift apart.
    const hasCounterparty = computed(
      () => !isCreationType.value && Boolean(props.transaction.linkedUser?.gradidoID),
    )

    const nameProps = computed<NameProps>(() => {
      if (isCreationType.value) {
        // A creation always comes with the community's stand-in; without one this threw before, too.
        const community = props.transaction.linkedUser as LinkedUser
        return {
          // ⛔ `min-w-0` travels with the name, not with its container: inside the flex line
          // it shares with the heart it is the item that has to be allowed to shrink, or a
          // long name pushes the heart out of the row instead of clipping.
          class: 'fw-bold min-w-0',
          // The COMMUNITY's name (NU-020). A creation booking is linked to the community
          // stand-in, not to the moderator who approved it -- the backend swaps that user in
          // unconditionally -- so `alias` carries the configured community name and this line
          // names the community, as it always did. No real name is delivered here any more.
          creationLinkedUser: memberAlias(community.alias, community.gradidoID),
        }
      } else {
        return {
          class: 'fw-bold min-w-0',
          amount: props.transaction.amount,
          linkedUser: props.transaction.linkedUser,
          linkId: props.transaction.linkId,
          // The community stands on the line below (see `communityName`), not behind the name.
          withCommunity: false,
        }
      }
    })

    const handleOpenAfterScroll = (scrollY: number) => {
      const handleScrollEnd = () => {
        window.removeEventListener('scrollend', handleScrollEnd)
      }

      window.addEventListener('scrollend', handleScrollEnd)
      window.scrollTo(0, scrollY)
    }

    const transactionToHighlightId = computed(() => store.transactionToHighlightId)

    watch(
      transactionToHighlightId,
      async (newValue) => {
        if (parseInt(newValue) === props.transaction.id) {
          visible.value = true
          setTimeout(() => {
            const element = document.getElementById(
              `transaction-${props.transaction.id}`,
            ) as HTMLElement
            const yVal = element.getBoundingClientRect().top + window.pageYOffset - 16
            handleOpenAfterScroll(yVal)
          }, 300)
          await store.changeTransactionToHighlightId('')
        }
      },
      { immediate: true },
    )

    // What a spec reads off the row: whether it is open.
    expose({ visible })

    return () => {
      const picture = pictureShown.value
      return (
        <div
          id={`transaction-${props.transaction.id}`}
          ref={gddTransaction}
          class={[`transaction-slot-${props.transaction.type}`, classes['gdd-transaction']]}
          data-transaction-id={`transaction-${props.transaction.id}`}
          onClick={toggleVisible}
        >
          {/* The face takes what it needs and no more, as in the contact list: the text starts one
              gutter to its right. It used to take two twelfths of the row -- 91 to 120 points on the
              desk for a 48-point face, measured at 1025 and 1440 -- and every point of that was
              missing from the memo, which cut off early (Bernd, 21.09.2026: "genau so wie bei den
              Kontakten"). Now it is 72: the face and one gutter. The width
              it takes is `--transaction-face-col`, and the amount and the memo below are indented
              by exactly that, so they keep standing under the name. */}
          <BRow class='align-items-center gdd-transaction-row' style={faceWidth}>
            <BCol cols='auto'>
              {h(avatarComponent.value, avatarProps.value, {
                default: () =>
                  isCreationType.value ? <VariantIcon icon='gift' variant='white' /> : null,
              })}
            </BCol>
            {/* ⛔ `min-w-0`, because the name below is `nowrap` and would otherwise set this
                column's floor to its own full width -- pushing the amount and the arrow out of
                the row. Same guard, same class name, as `ContactRow` and the bookings column. */}
            <BCol class='min-w-0'>
              {/* ⛔ The heart stands HERE, beside the name, and not at the row's end where it
                  used to. Next to the collapse arrow it read as a mark on the BOOKING; it is a
                  mark on the PERSON, and a booking cannot be a favourite. (Bernd, 04.09.2026.)
                  Beside the name it says what it means without a word.

                  The name is its own control (KF-010): it opens the contact window for this
                  counterparty, while a tap anywhere else on the row still opens the booking's
                  details. What it hands up is the member it was given -- `Name` sends back the
                  `linkedUser` it was drawing, so no second expression here can name somebody
                  else. The LIST owns the window, one per list rather than one per row.

                  ⚠️ The heart swallows its own click (`@click.stop.prevent` in the component),
                  so it does not open the booking underneath it -- which is why it can sit
                  inside this row at all. */}
              <div class='d-flex align-items-center gap-2'>
                {useNameComponent.value ? (
                  <Name
                    {...nameProps.value}
                    onOpen={(member: LinkedUser) => emit('open-member', member)}
                  />
                ) : (
                  <div class={nameProps.value.class}>{nameProps.value.creationLinkedUser}</div>
                )}
                {hasCounterparty.value ? (
                  <FavoriteHeart
                    member={props.transaction.linkedUser as LinkedUser & { gradidoID: string }}
                  />
                ) : null}
              </div>
              {/* The community on a line of its own, as the contacts have it -- not behind the name
                  after a slash. One line more, and a quieter row (Bernd, 21.09.2026). A creation
                  names the community already, in the line above. */}
              {communityName.value ? (
                <div class='small text-muted' data-test='transaction-community'>
                  {communityName.value}
                </div>
              ) : null}
              <span class='small'>
                {d(new Date(props.transaction.balanceDate as string), 'short')}
              </span>
              <span class='ms-4 small'>
                {d(new Date(props.transaction.balanceDate as string), 'time')}
              </span>
              {/* The emoji the recipient of the transfer answered it with (Bernd, 11.10.2026): behind
                  the time, in the line's own height -- on the recipient's row, where it is their own
                  and has the rim one's own reaction has in a conversation, and on the sender's.
                  ⛔ In the line that is there already: set in the opened row below, it must move
                  nothing of the list under the member's hand. Not a control: it is set in the
                  opened row. For the ear a lead and the reaction in one piece, as in a conversation
                  (ChatBubble). */}
              {reaction.value ? (
                <span
                  class={['transaction-reaction', { 'is-mine': reactionMine.value }]}
                  data-test='transaction-reaction'
                >
                  <span class='visually-hidden'>{t('chatThread.reactionsLead')}</span>
                  <span class='transaction-reaction-emoji' aria-hidden='true'>
                    {reaction.value}
                  </span>
                  <span class='visually-hidden' data-test='transaction-reaction-said'>
                    {reactionSaid.value}
                  </span>
                </span>
              ) : null}
            </BCol>
            {/* On the phone the amount and the arrow start a line of their own, together -- this
                break is what makes them one line rather than two. From `md` on it is gone and
                everything stands in one line, as before. */}
            <div class='w-100 d-md-none' />
            {/* ⛔ `col` has to be SAID here. bootstrap-vue-next adds the plain `col` class only to a
                column that has no breakpoint sizes at all; with `md`/`lg` given, the phone got no
                width class, so Bootstrap's `.row > *` made the amount 100% wide beside its
                indent -- past the row's right edge -- and the arrow wrapped onto a line of its own,
                at the left. Measured at 390 points against the served stylesheet: with `col` the
                amount takes what the arrow leaves, and the page is exactly as wide as the screen.
                The indent on the phone is the face's column (`.transaction-amount-col`), so the
                amount stands under the name. */}
            <BCol col md='3' lg='3' class='transaction-amount-col'>
              <div class='small mb-2'>
                {/* eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys */}
                {t(`decay.types.${props.transaction.typeId.toLowerCase()}`)}
              </div>
              <div
                class={[
                  'fw-bold',
                  {
                    'gradido-global-color-accent': props.transaction.typeId === 'RECEIVE',
                    'text-140': props.transaction.typeId === 'SEND',
                  },
                ]}
                data-test='transaction-amount'
              >
                {GDD(props.transaction.amount)}
              </div>
              {/* A thank-you greeting is a link too, but nobody who got one thinks of a link: the
                  row says what it was (Bernd, 04.10.2026). Asked of the greeting itself, not of
                  its picture: one with a motif this wallet does not know is a greeting still. */}
              {props.transaction.linkId && props.transaction.greeting ? (
                <div class='small' data-test='via-greeting'>
                  {t('via_greeting')}{' '}
                  <VariantIcon icon='balloon-heart' variant='muted' class='m-mb-1' />
                </div>
              ) : props.transaction.linkId ? (
                <div class='small'>
                  {t('via_link')} <VariantIcon icon='link45deg' variant='muted' class='m-mb-1' />
                </div>
              ) : props.transaction.thankYouCardLabel ? (
                /*
                  ★ One rule, in all three of these rows, and no component decides who may see what:
                  if a name came with the booking, it is shown; if not, only that a card was used.

                  What makes that safe is the BACKEND. It fills the name on a SEND row alone — the
                  payer's own row, where the card is theirs and answers "which of my cards was that?"
                  for somebody who has had several. The till's row arrives without one: they held the
                  card for a moment, but in their own history somebody else's word for it is none of
                  their business. A rule that lives in one place cannot drift apart in three.
                */
                <div class='small' data-test='transaction-via-card'>
                  {props.transaction.thankYouCardLabel}{' '}
                  <VariantIcon icon='cards' variant='muted' class='m-mb-1' />
                </div>
              ) : props.transaction.viaThankYouCard ? (
                <div class='small' data-test='transaction-via-card'>
                  {t('via_card')} <VariantIcon icon='cards' variant='muted' class='m-mb-1' />
                </div>
              ) : null}
            </BCol>
            {/* The arrow alone now; the heart moved up beside the name. `auto` at EVERY width,
                beside the amount: on the phone it used to take a line of its own (`cols="12"`)
                under everything else, where nobody looks for it -- on the desk it always stood at
                the amount's height, and now it does there too (Bernd, 11.09.2026). */}
            <BCol
              cols='auto'
              class='d-flex justify-content-end align-items-center transaction-arrow-col'
            >
              <CollapseIcon class='text-end' visible={visible.value} />
            </BCol>
            {/* ⛔ The memo belongs to the row, not to the opened part: its first line is readable
                without opening the booking, and opening it shows the whole memo in the same place
                rather than a second copy further down (Bernd, 11.09.2026). No heading over it --
                italics and the muted colour say what it is.

                Opened, a click on it does nothing, as it did in the old place: somebody selecting
                the text to copy it should not close the booking under their hand. Closed, it is
                part of the row like everything else, and a click opens it.

                From `md` on its width is set in the stylesheet: it ends where the amount begins,
                under the name and the date rather than under the whole row (Bernd, 11.09.2026: "nicht
                so breit … wie die Spalte"). On the phone it runs from under the name to the row's
                end, under the amount. */}
            {/* A line of its own, said: sized from the stylesheet rather than the grid, the memo
                would otherwise take a place in the line above wherever there is room left. */}
            {props.transaction.memo ? <div class='w-100' /> : null}
            {props.transaction.memo ? (
              <BCol cols='12' class='mt-1 transaction-memo-col'>
                <div
                  class={['transaction-memo', { 'transaction-memo-clamped': !visible.value }]}
                  data-test='transaction-memo'
                  onClick={(event: MouseEvent) => visible.value && event.stopPropagation()}
                >
                  {/* The picture the sender added to the transfer (ZE-016, F19 = B): small, over the
                      memo, in the OPENED row only -- for whoever switched transfers in the chat off
                      and would never see it otherwise. A photo is asked for when the row is opened,
                      by the id of this very booking, as the conversation asks for it.
                      The picture of a thank-you greeting stands in the same place, for both of the
                      two (Bernd, 04.10.2026); its photo is asked for by the id of the LINK, as the
                      bubble of the conversation asks for it. */}
                  {visible.value && picture ? (
                    <div class='transaction-picture' data-test='transaction-picture'>
                      {picture.photo ? (
                        <ThankYouGreetingPhoto
                          class='transaction-picture-image'
                          transactionId={greetingShown.value ? undefined : props.transaction.id}
                          linkId={greetingShown.value ? props.transaction.linkId : undefined}
                          alt={t('thank-you-greeting.photo-of', { name: pictureSender.value })}
                        />
                      ) : (
                        <img
                          class='transaction-picture-image'
                          src={picture.motif.src}
                          alt={picture.motif.name}
                          width={THANK_YOU_MOTIF_WIDTH}
                          height={THANK_YOU_MOTIF_HEIGHT}
                        />
                      )}
                    </div>
                  ) : null}
                  <MemoText memo={props.transaction.memo} />
                </div>
              </BCol>
            ) : null}
          </BRow>
          <BCollapse modelValue={visible.value} class='pb-4 pt-3'>
            {/* Reacting to a transfer one received (Bernd, 11.10.2026): the choice a conversation has
                at a message -- six emoji a press away, "+" for all forty-eight --, over the booking's
                numbers. Only where the server says the member may (`canReact`): on their own row of
                a transfer from a member of this community. One's own reaction is the pressed one,
                and a press on it takes it back.

                Made when the row is opened for the first time, and kept while it closes:
                twenty-five rows of a page would each hold seven buttons nobody sees, and what is
                taken out of a row that is closing makes it jump. Made anew each time the row
                opens (`openings`): the forty-eight left open are the six again, as in a menu that
                is opened again. A press in it is not a press on the row, which would close the
                booking under the member's hand. */}
            {opened.value && props.transaction.canReact ? (
              <div
                class='transaction-react px-1'
                data-test='transaction-react'
                onClick={(event: MouseEvent) => event.stopPropagation()}
              >
                <div class='mb-2' aria-hidden='true'>
                  <IMdiEmoticonHappyOutline class='me-2' />
                  <b>{t('chatThread.react')}</b>
                </div>
                <ChatReactionChoice
                  key={openings.value}
                  class='transaction-react-choice'
                  own={reaction.value}
                  busy={reacting.value}
                  onReact={react}
                />
              </div>
            ) : null}
            {/* A thank-you received, opened (W2 of the waves of gratitude, utils/thanksNudge): under the
                choice of a reaction, "Dank weitergeben?" -- outwards, to somebody, never back to the
                giver. Up to seven days after it came, until answered on this device. Closed, the row
                says nothing of it, and the right column's rows have none. A press in it is not a press
                on the row, which would close the booking under the member's hand. */}
            {passOnOffered.value ? (
              <div
                class='transaction-pass-on px-1'
                data-test='transaction-pass-on'
                onClick={(event: MouseEvent) => event.stopPropagation()}
              >
                <ThanksNudge
                  ref={passOnLine}
                  question={t('thanksNudge.passOn')}
                  yes={t('thanksNudge.someone')}
                  no={t('thanksNudge.notNow')}
                  onYes={passOn}
                  onNo={notNow}
                />
              </div>
            ) : null}
            <DecayInformation
              typeId={props.transaction.typeId}
              decay={props.transaction.decay}
              amount={props.transaction.amount}
              balance={props.transaction.balance}
              previousBalance={props.transaction.previousBalance as string}
            />
          </BCollapse>
        </div>
      )
    }
  },
})
