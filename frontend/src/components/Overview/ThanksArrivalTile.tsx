// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { BBadge, BContainer, type ColorVariant } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  type PropType,
  reactive,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatReactionChoice from '@/components/Chat/ChatReactionChoice.vue'
import type { TransactionRow } from '@/components/GddTransactionList'
import { I18nText } from '@/components/I18nText'
import ThanksNudge from '@/components/ThanksNudge.vue'
import ThankYouGreetingPhoto from '@/components/ThankYouGreeting/ThankYouGreetingPhoto.vue'
import MemoText from '@/components/TransactionRows/MemoText'
import { useAmountInText } from '@/composables/useAmountInText'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { onChatMessageSent } from '@/composables/useChatSent'
import { pollChatNow } from '@/composables/useChatUpdates'
import { fetchMemberAvatars, memberAvatarProps } from '@/composables/useMemberAvatars'
import { usePassOnDraft } from '@/composables/usePassOnDraft'
import { useThanksNudges } from '@/composables/useThanksNudges'
import { useAppToast } from '@/composables/useToast'
import {
  isTransactionReactionUnderway,
  onTransactionReaction,
  reactToTransaction,
} from '@/composables/useTransactionReactions'
import { LIST_AVATAR_SIZE } from '@/constants'
import { useWalletStore } from '@/store/useWalletStore'
import { chatMemberKey } from '@/utils/chatMemberKey'
import { memberAlias } from '@/utils/gradidoAddress'
import { SEND_TYPES } from '@/utils/sendTypes'
import { THANK_YOU_MOTIF_HEIGHT, THANK_YOU_MOTIF_WIDTH } from '@/utils/thankYouMotifs'
import { transactionPictureShown } from '@/utils/transactionPicture'
import IIonLayersSharp from '~icons/ion/layers-sharp'
import IMdiEmoticonHappyOutline from '~icons/mdi/emoticon-happy-outline'
import classes from './ThanksArrivalTile.module.scss'

/** A picture as the booking list names it with the booking (utils/transactionPicture). */
type TransactionPicture = { motif: string | null; hasPicture: boolean }

/** A thank-you received, as the booking list carries it (utils/thanksNudge, `arrivalItems`). */
export type ThanksBooking = TransactionRow & {
  memo: string
  linkId: number | null
  canReact: boolean
  greeting: TransactionPicture | null
  picture: TransactionPicture | null
}

/**
 * "Dein Dank ist da." -- the moment a thank-you arrives (W3 of the waves of gratitude, FEAT-25),
 * at the top of the overview: up to three thank-yous received in the last seven days that have
 * no reaction yet, each with the giver's face, who and how much, the picture of a greeting, the
 * first line of the message -- and under each the choice of an emoji. A tap reacts as the booking
 * row does, and so mails the giver that the thank-you arrived (W1); then "Dank weitergeben?"
 * (W2) takes the choice's place.
 *
 * ⛔ WHICH thank-yous, the overview decides once, before the tiles are painted, and hands in
 * (`thanks`, composables/useThanksArrivals): a list that arrived later would push every tile
 * below this one down under a finger. From then on only the member takes thank-yous out of it --
 * with "Später", or with "Nicht jetzt" after the reaction, or by answering it in a conversation
 * opened over the overview (a reaction, a message to the giver). When none is left, the tile is
 * gone.
 *
 * Nothing of it is kept anywhere but on this device, under the member's key (useThanksNudges):
 * no setting (E-020), no mail of its own, no number (ZE-007). A second device shows a thank-you
 * put aside here once more; the reaction is the server's, and holds everywhere.
 */
export const ThanksArrivalTile = defineComponent({
  name: 'ThanksArrivalTile',
  props: {
    /**
     * The thank-yous to show, newest first (utils/thanksNudge, `arrivalItems`) -- bookings as the
     * booking list carries them. ⛔ Decided once by the overview before this tile is painted, and
     * never changed afterwards.
     */
    thanks: { type: Array as PropType<ThanksBooking[]>, default: () => [] },
  },
  setup(props) {
    const { t } = useI18n()
    const router = useRouter()
    const store = useWalletStore()
    const { client: apolloClient } = useApolloClient()
    const { toastError } = useAppToast()
    const amountInText = useAmountInText()
    const { isSeen, markSeen } = useThanksNudges()
    const passOnDraft = usePassOnDraft()

    /**
     * Whom the tile is for, read ONCE. Signing out empties the store while the overview still
     * stands, and whoever was painted these thank-yous is no longer there to read them.
     */
    const member = store.gradidoID

    /** The thank-yous the member is done with in this tile: "Später", or "Nicht jetzt" after the tap. */
    const gone = reactive(new Set<number>())
    /** The thank-yous the member reacted to here, once the server has said so: the line takes over. */
    const reacted = reactive(new Set<number>())
    /** The reactions on their way from this tile -- what the tile hears of them is its own. */
    const mine = new Set<number>()

    const shown = computed(() =>
      store.gradidoID === member ? props.thanks.filter((booking) => !gone.has(booking.id)) : [],
    )

    /** Whoever thanked, as the wallet names a member everywhere -- by the user name. */
    const nameOf = (booking: ThanksBooking) =>
      memberAlias(booking.linkedUser?.alias, booking.linkedUser?.gradidoID)

    /** "12,5 Gradido": the amount as a sentence says it, and its unit, which never stand apart. */
    const amountOf = (booking: ThanksBooking) => `${amountInText(booking.amount)} ${t('GDD-long')}`

    /**
     * The circle as the booking row draws it (GddTransaction): letters, colour and the picture from
     * the one helper, the zoom after them, white letters, the list's size.
     */
    const avatarOf = (booking: ThanksBooking) => {
      const avatar = memberAvatarProps(booking.linkedUser)
      return {
        ...avatar,
        ...avatarZoomBindings(booking.linkedUser, avatar),
        color: '#fff',
        size: LIST_AVATAR_SIZE,
      }
    }

    /** The picture of the greeting the booking was made from: `{ photo }` or `{ motif }`, or null. */
    const greetingOf = (booking: ThanksBooking) => transactionPictureShown(booking.greeting, t)
    /** The greeting's picture, else the one sent with the transfer -- a booking has one or neither. */
    const pictureOf = (booking: ThanksBooking) =>
      greetingOf(booking) ?? transactionPictureShown(booking.picture, t)

    /**
     * The givers' faces, asked for the way every list asks for them: the date decides, and a face
     * this device holds already costs nothing (the layout has usually asked for it with the column
     * beside the overview). ⛔ Not optional: the tile has no list behind it, and whether a face
     * appears must not depend on which way that column is turned.
     */
    watch(
      () => props.thanks,
      (list) => {
        fetchMemberAvatars(
          apolloClient,
          list.map((booking) => booking.linkedUser),
        )
      },
      { immediate: true },
    )

    const tile = ref<HTMLElement | null>(null)
    const itemOf = (booking: ThanksBooking) =>
      tile.value?.querySelector(`[data-transaction-id="${booking.id}"]`) ?? null
    const holdsKeyboard = (booking: ThanksBooking) =>
      Boolean(itemOf(booking)?.contains(document.activeElement))

    /** The first thing to press in a thank-you: its choice, its line, else its way to answer. */
    const focusIn = (booking: ThanksBooking) => {
      const item = itemOf(booking)
      const target =
        item?.querySelector<HTMLElement>('.chat-reaction-choice [tabindex="0"]') ??
        item?.querySelector<HTMLElement>('[data-test="thanks-nudge-yes"]') ??
        item?.querySelector<HTMLElement>('[data-test="thanks-arrival-answer"]')
      target?.focus({ preventScroll: true })
    }

    /**
     * A thank-you leaves the tile. A keyboard that stood in it would fall out of the page with it:
     * it goes on to the thank-you that takes its place, or the one before.
     */
    const leave = async (booking: ThanksBooking) => {
      const index = shown.value.findIndex((one) => one.id === booking.id)
      const hadKeyboard = holdsKeyboard(booking)
      gone.add(booking.id)
      if (!hadKeyboard) {
        return
      }
      await nextTick()
      const next = shown.value[index] ?? shown.value[index - 1]
      if (next) {
        focusIn(next)
      }
    }

    /**
     * An emoji was pressed: the member's reaction to the transfer, as in the booking row
     * (reactToTransaction -- one at a time for a booking, said to every place that holds it). The
     * server counts the transfer as seen with it (E-086), so the beat asks at once and the mark at
     * the giver's name goes within a second, as when a row is opened. Then "Dank weitergeben?" -- not
     * where the member has answered that in the booking row already: the thank-you leaves.
     * Where the server refuses, nothing has changed, and the member is told.
     */
    const react = async (booking: ThanksBooking, emoji: string) => {
      mine.add(booking.id)
      let done
      try {
        done = await reactToTransaction(apolloClient, { ...booking, reaction: null }, emoji)
      } catch {
        toastError(t('chatThread.reactionFailed'))
        return
      } finally {
        mine.delete(booking.id)
      }
      if (!done || done.reaction === null) {
        return
      }
      pollChatNow()
      if (isSeen('pass-on', booking.id)) {
        await leave(booking)
        return
      }
      const hadKeyboard = holdsKeyboard(booking)
      reacted.add(booking.id)
      if (!hadKeyboard) {
        return
      }
      await nextTick()
      focusIn(booking)
    }

    /**
     * A reaction set somewhere else while the overview stands -- in a conversation opened over it:
     * the thank-you is answered, and leaves the tile.
     */
    const stopReactions = onTransactionReaction(
      ({ transactionId, reaction }: { transactionId: number; reaction: string | null }) => {
        if (mine.has(transactionId) || reaction === null || reacted.has(transactionId)) {
          return
        }
        const booking = shown.value.find((one) => one.id === transactionId)
        if (booking) {
          gone.add(booking.id)
        }
      },
    )
    onBeforeUnmount(stopReactions)

    /**
     * A message written to a giver while the overview stands -- in a conversation opened over it from
     * the column beside it: the thank-you is answered (F E-046), and leaves the tile, as the server
     * will leave it out on the next opening (`answered`). Every thank-you of that person, named the
     * way the chat names a person: without regard to case, a missing community being this one
     * (chatMemberKey). As with a reaction from elsewhere, not one the member reacted to here: there
     * "Dank weitergeben?" stands, a question of its own. Not through `leave`: the keyboard is in the
     * window over the tile.
     */
    const stopMessages = onChatMessageSent(
      (person: { gradidoID: string; communityUuid?: string | null }) => {
        const writtenTo = chatMemberKey(person, store.communityUuid)
        for (const booking of shown.value) {
          if (reacted.has(booking.id)) {
            continue
          }
          if (chatMemberKey(booking.linkedUser, store.communityUuid) === writtenTo) {
            gone.add(booking.id)
          }
        }
      },
    )
    onBeforeUnmount(stopMessages)

    /**
     * "Jemandem danken": the send form with nobody named -- outwards, never back to the giver. Its
     * page learns which thank-you the transfer passes on: this booking, handed over in memory
     * (usePassOnDraft), the trail nobody is shown. Where the form is not reached, it is taken back.
     */
    const passOn = async (booking: ThanksBooking) => {
      markSeen('pass-on', booking.id)
      const handed = passOnDraft.put(booking.id)
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

    /** "Nicht jetzt": the line is answered, and the thank-you leaves the tile. */
    const notNow = (booking: ThanksBooking) => {
      markSeen('pass-on', booking.id)
      leave(booking)
    }

    /**
     * "Antworten": the conversation with whoever thanked, by the address the reply button of a mail
     * has (`/contacts?with=…&community=…`). A missing community is this one.
     */
    const answer = (booking: ThanksBooking) => {
      const gradidoID = booking.linkedUser?.gradidoID
      const communityUuid = booking.linkedUser?.communityUuid
      router.push({
        path: '/contacts',
        query: communityUuid ? { with: gradidoID, community: communityUuid } : { with: gradidoID },
      })
    }

    /** "Später": put aside on this device; the booking row is left as it is. */
    const later = (booking: ThanksBooking) => {
      markSeen('arrival', booking.id)
      leave(booking)
    }

    return () =>
      shown.value.length ? (
        // The frame of the tiles below it (MatchingTile, ShowFriendsTile), so the three read as one
        // family -- py-3 and not p-3 for the reason ShowFriendsTile gives. Nothing at all where no
        // thank-you is left to show: the tile carries no number and no counter (ZE-007).
        <div
          ref={tile}
          class={['mb-3 py-3 thanks-arrival-tile', classes['thanks-arrival-tile']]}
          data-test='thanks-arrival-tile'
        >
          {/* The word of the menu entry the thank-yous live under, with its icon: a newcomer can tell
              that the tile and "Transaktionen" in the menu are about one thing (Bernd, 11.10.2026, for
              the matching tile). No variant, or the badge's own text colour beats the gradient's
              white. */}
          <BBadge
            variant={'' as ColorVariant}
            class='thanks-arrival-tile-label bg-gradido-gradient'
            data-test='thanks-arrival-tile-label'
          >
            <IIonLayersSharp aria-hidden='true' />
            <span>{t('navigation.transactions')}</span>
          </BBadge>
          <BContainer class='bg-white app-box-shadow gradido-border-radius p-4 mt--3 thanks-arrival-tile-box'>
            {/* One sentence for one thank-you and for three. */}
            <div class='h3 mb-0 thanks-arrival-tile-heading' data-test='thanks-arrival-heading'>
              {t('thanksArrival.title')}
            </div>
            <ul class='thanks-arrival-list'>
              {shown.value.map((booking) => {
                const picture = pictureOf(booking)
                return (
                  <li
                    key={booking.id}
                    class='thanks-arrival-item'
                    data-transaction-id={booking.id}
                    data-test='thanks-arrival-item'
                  >
                    <div class='thanks-arrival-item-head'>
                      {/* The giver's face as the booking row draws it: the same helper, the same size,
                          and open at full size on a tap where there is a picture (AS-018). */}
                      <div class='thanks-arrival-item-face'>
                        <AppAvatar {...avatarOf(booking)} />
                      </div>
                      <div class='thanks-arrival-item-text'>
                        {/* One sentence with two bold parts, which the ten languages put in different
                            places: through <i18n-t> with slots, as the sheet a thank-you arrives on has it
                            (RedeemThanksPaper). The amount takes its unit along, so both stand bold as
                            one, and never apart at the end of a line. The name is somebody else's words:
                            interpolated, never markup. */}
                        <I18nText
                          keypath='thanksArrival.from'
                          tag='div'
                          scope='global'
                          class='thanks-arrival-from'
                          data-test='thanks-arrival-from'
                          v-slots={{
                            name: () => <b>{nameOf(booking)}</b>,
                            amount: () => <b>{amountOf(booking)}</b>,
                          }}
                        />
                        {/* The picture of a thank-you greeting, or the one the sender added to the transfer,
                            as the opened row of the booking list shows it (GddTransaction): a photo is
                            asked for by the id of the LINK for a greeting and by the id of the booking for
                            a transfer. Nothing where there is no picture -- no empty room. */}
                        {picture ? (
                          <div class='thanks-arrival-picture' data-test='thanks-arrival-picture'>
                            {picture.photo ? (
                              <ThankYouGreetingPhoto
                                class='thanks-arrival-picture-image'
                                transactionId={greetingOf(booking) ? undefined : booking.id}
                                linkId={greetingOf(booking) ? booking.linkId : undefined}
                                alt={t('thank-you-greeting.photo-of', { name: nameOf(booking) })}
                              />
                            ) : (
                              <img
                                class='thanks-arrival-picture-image'
                                src={picture.motif.src}
                                alt={picture.motif.name}
                                width={THANK_YOU_MOTIF_WIDTH}
                                height={THANK_YOU_MOTIF_HEIGHT}
                              />
                            )}
                          </div>
                        ) : null}
                        {/* The message on one line, as the closed booking row has it: its first line and
                            an ellipsis; the whole of it is read out, and stands in the booking and in the
                            conversation. Its addresses are links (MemoText). */}
                        {booking.memo ? (
                          <div class='thanks-arrival-memo' data-test='thanks-arrival-memo'>
                            <MemoText memo={booking.memo} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {/* The one tap (Bernd: the reaction must be lighter than putting the phone away): the
                        choice the opened booking row has, with the same small heading -- and the same
                        behaviour, `reactToTransaction`, so that a reaction here is the reaction there,
                        mails the giver the first time (W1) and counts the transfer as seen (E-086). */}
                    {!reacted.has(booking.id) && booking.canReact ? (
                      <div class='thanks-arrival-react' data-test='thanks-arrival-react'>
                        <div class='mb-2' aria-hidden='true'>
                          <IMdiEmoticonHappyOutline class='me-2' />
                          <b>{t('chatThread.react')}</b>
                        </div>
                        <ChatReactionChoice
                          class='thanks-arrival-react-choice'
                          own={null}
                          busy={isTransactionReactionUnderway(booking.id)}
                          onReact={(emoji: string) => react(booking, emoji)}
                        />
                      </div>
                    ) : reacted.has(booking.id) ? (
                      // After the tap, in its place: "Dank weitergeben?", the line of the opened booking
                      // row (W2), under the same key on this device, so that the row is quiet about it
                      // afterwards. Outwards, to somebody -- never back to the giver.
                      <div class='thanks-arrival-pass-on' data-test='thanks-arrival-pass-on'>
                        <ThanksNudge
                          question={t('thanksNudge.passOn')}
                          yes={t('thanksNudge.someone')}
                          no={t('thanksNudge.notNow')}
                          onYes={() => passOn(booking)}
                          onNo={() => notNow(booking)}
                        />
                      </div>
                    ) : null}
                    {/* Two quiet ways, at the right: into the conversation with the giver, and "Später" --
                        the tile on this device shows it no more, the booking row is left as it is. Once
                        reacted, "Nicht jetzt" of the line above is the way to put it aside, and two ways
                        side by side to say no would be one too many. */}
                    <div class='thanks-arrival-actions'>
                      <button
                        type='button'
                        class='thanks-arrival-answer'
                        data-test='thanks-arrival-answer'
                        onClick={() => answer(booking)}
                      >
                        {t('thanksArrival.answer')}
                      </button>
                      {!reacted.has(booking.id) ? (
                        <button
                          type='button'
                          class='thanks-arrival-later'
                          data-test='thanks-arrival-later'
                          onClick={() => later(booking)}
                        >
                          {t('thanksArrival.later')}
                        </button>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </BContainer>
        </div>
      ) : null
  },
})
