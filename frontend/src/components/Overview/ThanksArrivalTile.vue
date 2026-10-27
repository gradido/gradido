<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The frame of the tiles below it (MatchingTile, ShowFriendsTile), so the three read as one
       family -- py-3 and not p-3 for the reason ShowFriendsTile gives. Nothing at all where no
       thank-you is left to show: the tile carries no number and no counter (ZE-007). -->
  <div
    v-if="shown.length"
    ref="tile"
    class="mb-3 py-3 thanks-arrival-tile"
    data-test="thanks-arrival-tile"
  >
    <!-- The word of the menu entry the thank-yous live under, with its icon: a newcomer can tell
         that the tile and "Transaktionen" in the menu are about one thing (Bernd, 11.10.2026, for
         the matching tile). No variant, or the badge's own text colour beats the gradient's
         white. -->
    <BBadge
      variant=""
      class="thanks-arrival-tile-label bg-gradido-gradient"
      data-test="thanks-arrival-tile-label"
    >
      <i-ion-layers-sharp aria-hidden="true" />
      <span>{{ $t('navigation.transactions') }}</span>
    </BBadge>
    <BContainer
      class="bg-white app-box-shadow gradido-border-radius p-4 mt--3 thanks-arrival-tile-box"
    >
      <!-- One sentence for one thank-you and for three. -->
      <div class="h3 mb-0 thanks-arrival-tile-heading" data-test="thanks-arrival-heading">
        {{ $t('thanksArrival.title') }}
      </div>
      <ul class="thanks-arrival-list">
        <li
          v-for="booking in shown"
          :key="booking.id"
          class="thanks-arrival-item"
          :data-transaction-id="booking.id"
          data-test="thanks-arrival-item"
        >
          <div class="thanks-arrival-item-head">
            <!-- The giver's face as the booking row draws it: the same helper, the same size,
                 and open at full size on a tap where there is a picture (AS-018). -->
            <div class="thanks-arrival-item-face">
              <app-avatar v-bind="avatarOf(booking)" />
            </div>
            <div class="thanks-arrival-item-text">
              <!-- One sentence with two bold parts, which the ten languages put in different
                   places: through <i18n-t> with slots, as the sheet a thank-you arrives on has it
                   (RedeemThanksPaper). The amount takes its unit along, so both stand bold as
                   one, and never apart at the end of a line. The name is somebody else's words:
                   interpolated, never markup. -->
              <i18n-t
                keypath="thanksArrival.from"
                tag="div"
                scope="global"
                class="thanks-arrival-from"
                data-test="thanks-arrival-from"
              >
                <template #name>
                  <b>{{ nameOf(booking) }}</b>
                </template>
                <template #amount>
                  <b>{{ amountOf(booking) }}</b>
                </template>
              </i18n-t>
              <!-- The picture of a thank-you greeting, or the one the sender added to the transfer,
                   as the opened row of the booking list shows it (GddTransaction): a photo is
                   asked for by the id of the LINK for a greeting and by the id of the booking for
                   a transfer. Nothing where there is no picture -- no empty room. -->
              <div
                v-if="pictureOf(booking)"
                class="thanks-arrival-picture"
                data-test="thanks-arrival-picture"
              >
                <thank-you-greeting-photo
                  v-if="pictureOf(booking).photo"
                  class="thanks-arrival-picture-image"
                  :transaction-id="greetingOf(booking) ? undefined : booking.id"
                  :link-id="greetingOf(booking) ? booking.linkId : undefined"
                  :alt="$t('thank-you-greeting.photo-of', { name: nameOf(booking) })"
                />
                <img
                  v-else
                  class="thanks-arrival-picture-image"
                  :src="pictureOf(booking).motif.src"
                  :alt="pictureOf(booking).motif.name"
                  :width="THANK_YOU_MOTIF_WIDTH"
                  :height="THANK_YOU_MOTIF_HEIGHT"
                />
              </div>
              <!-- The message on one line, as the closed booking row has it: its first line and
                   an ellipsis; the whole of it is read out, and stands in the booking and in the
                   conversation. Its addresses are links (MemoText). -->
              <div v-if="booking.memo" class="thanks-arrival-memo" data-test="thanks-arrival-memo">
                <memo-text :memo="booking.memo" />
              </div>
            </div>
          </div>
          <!-- The one tap (Bernd: the reaction must be lighter than putting the phone away): the
               choice the opened booking row has, with the same small heading -- and the same
               behaviour, `reactToTransaction`, so that a reaction here is the reaction there,
               mails the giver the first time (W1) and counts the transfer as seen (E-086). -->
          <div
            v-if="!reacted.has(booking.id) && booking.canReact"
            class="thanks-arrival-react"
            data-test="thanks-arrival-react"
          >
            <div class="mb-2" aria-hidden="true">
              <i-mdi-emoticon-happy-outline class="me-2" />
              <b>{{ $t('chatThread.react') }}</b>
            </div>
            <chat-reaction-choice
              class="thanks-arrival-react-choice"
              :own="null"
              :busy="isTransactionReactionUnderway(booking.id)"
              @react="react(booking, $event)"
            />
          </div>
          <!-- After the tap, in its place: "Dank weitergeben?", the line of the opened booking row
               (W2), under the same key on this device, so that the row is quiet about it
               afterwards. Outwards, to somebody -- never back to the giver. -->
          <div
            v-else-if="reacted.has(booking.id)"
            class="thanks-arrival-pass-on"
            data-test="thanks-arrival-pass-on"
          >
            <thanks-nudge
              :question="$t('thanksNudge.passOn')"
              :yes="$t('thanksNudge.someone')"
              :no="$t('thanksNudge.notNow')"
              @yes="passOn(booking)"
              @no="notNow(booking)"
            />
          </div>
          <!-- Two quiet ways, at the right: into the conversation with the giver, and "Später" --
               the tile on this device shows it no more, the booking row is left as it is. Once
               reacted, "Nicht jetzt" of the line above is the way to put it aside, and two ways
               side by side to say no would be one too many. -->
          <div class="thanks-arrival-actions">
            <button
              type="button"
              class="thanks-arrival-answer"
              data-test="thanks-arrival-answer"
              @click="answer(booking)"
            >
              {{ $t('thanksArrival.answer') }}
            </button>
            <button
              v-if="!reacted.has(booking.id)"
              type="button"
              class="thanks-arrival-later"
              data-test="thanks-arrival-later"
              @click="later(booking)"
            >
              {{ $t('thanksArrival.later') }}
            </button>
          </div>
        </li>
      </ul>
    </BContainer>
  </div>
</template>

<script setup>
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
 * with "Später", or with "Nicht jetzt" after the reaction. When none is left, the tile is gone.
 *
 * Nothing of it is kept anywhere but on this device, under the member's key (useThanksNudges):
 * no setting (E-020), no mail of its own, no number (ZE-007). A second device shows a thank-you
 * put aside here once more; the reaction is the server's, and holds everywhere.
 */
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useApolloClient } from '@vue/apollo-composable'
import { BBadge, BContainer } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatReactionChoice from '@/components/Chat/ChatReactionChoice.vue'
import ThanksNudge from '@/components/ThanksNudge.vue'
import ThankYouGreetingPhoto from '@/components/ThankYouGreeting/ThankYouGreetingPhoto.vue'
import MemoText from '@/components/TransactionRows/MemoText'
import { useAmountInText } from '@/composables/useAmountInText'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
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
import { memberAlias } from '@/utils/gradidoAddress'
import { SEND_TYPES } from '@/utils/sendTypes'
import { THANK_YOU_MOTIF_HEIGHT, THANK_YOU_MOTIF_WIDTH } from '@/utils/thankYouMotifs'
import { transactionPictureShown } from '@/utils/transactionPicture'

const props = defineProps({
  /**
   * The thank-yous to show, newest first (utils/thanksNudge, `arrivalItems`) -- bookings as the
   * booking list carries them. ⛔ Decided once by the overview before this tile is painted, and
   * never changed afterwards.
   */
  thanks: { type: Array, default: () => [] },
})

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
const gone = reactive(new Set())
/** The thank-yous the member reacted to here, once the server has said so: the line takes over. */
const reacted = reactive(new Set())
/** The reactions on their way from this tile -- what the tile hears of them is its own. */
const mine = new Set()

const shown = computed(() =>
  store.gradidoID === member ? props.thanks.filter((booking) => !gone.has(booking.id)) : [],
)

/** Whoever thanked, as the wallet names a member everywhere -- by the user name. */
const nameOf = (booking) => memberAlias(booking.linkedUser?.alias, booking.linkedUser?.gradidoID)

/** "12,5 Gradido": the amount as a sentence says it, and its unit, which never stand apart. */
const amountOf = (booking) => `${amountInText(booking.amount)}\u00a0${t('GDD-long')}`

/**
 * The circle as the booking row draws it (GddTransaction): letters, colour and the picture from
 * the one helper, the zoom after them, white letters, the list's size.
 */
const avatarOf = (booking) => {
  const avatar = memberAvatarProps(booking.linkedUser)
  return {
    ...avatar,
    ...avatarZoomBindings(booking.linkedUser, avatar),
    color: '#fff',
    size: LIST_AVATAR_SIZE,
  }
}

/** The picture of the greeting the booking was made from: `{ photo }` or `{ motif }`, or null. */
const greetingOf = (booking) => transactionPictureShown(booking.greeting, t)
/** The greeting's picture, else the one sent with the transfer -- a booking has one or neither. */
const pictureOf = (booking) => greetingOf(booking) ?? transactionPictureShown(booking.picture, t)

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

const tile = ref(null)
const itemOf = (booking) =>
  tile.value?.querySelector(`[data-transaction-id="${booking.id}"]`) ?? null
const holdsKeyboard = (booking) => Boolean(itemOf(booking)?.contains(document.activeElement))

/**
 * A thank-you leaves the tile. A keyboard that stood in it would fall out of the page with it:
 * it goes on to the thank-you that takes its place, or the one before.
 */
const leave = async (booking) => {
  const index = shown.value.findIndex((one) => one.id === booking.id)
  const hadKeyboard = holdsKeyboard(booking)
  gone.add(booking.id)
  if (!hadKeyboard) return
  await nextTick()
  const next = shown.value[index] ?? shown.value[index - 1]
  if (next) focusIn(next)
}

/** The first thing to press in a thank-you: its choice, its line, else its way to answer. */
const focusIn = (booking) => {
  const item = itemOf(booking)
  const target =
    item?.querySelector('.chat-reaction-choice [tabindex="0"]') ??
    item?.querySelector('[data-test="thanks-nudge-yes"]') ??
    item?.querySelector('[data-test="thanks-arrival-answer"]')
  target?.focus({ preventScroll: true })
}

/**
 * An emoji was pressed: the member's reaction to the transfer, as in the booking row
 * (reactToTransaction -- one at a time for a booking, said to every place that holds it). The
 * server counts the transfer as seen with it (E-086), so the beat asks at once and the mark at
 * the giver's name goes within a second, as when a row is opened. Then "Dank weitergeben?" -- not
 * where the member has answered that in the booking row already: the thank-you leaves.
 * Where the server refuses, nothing has changed, and the member is told.
 */
const react = async (booking, emoji) => {
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
  if (!done || done.reaction === null) return
  pollChatNow()
  if (isSeen('pass-on', booking.id)) {
    await leave(booking)
    return
  }
  const hadKeyboard = holdsKeyboard(booking)
  reacted.add(booking.id)
  if (!hadKeyboard) return
  await nextTick()
  focusIn(booking)
}

/**
 * A reaction set somewhere else while the overview stands -- in a conversation opened over it:
 * the thank-you is answered, and leaves the tile.
 */
const stopReactions = onTransactionReaction(({ transactionId, reaction }) => {
  if (mine.has(transactionId) || reaction === null || reacted.has(transactionId)) return
  const booking = shown.value.find((one) => one.id === transactionId)
  if (booking) gone.add(booking.id)
})
onBeforeUnmount(stopReactions)

/**
 * "Jemandem danken": the send form with nobody named -- outwards, never back to the giver. Its
 * page learns which thank-you the transfer passes on: this booking, handed over in memory
 * (usePassOnDraft), the trail nobody is shown. Where the form is not reached, it is taken back.
 */
const passOn = async (booking) => {
  markSeen('pass-on', booking.id)
  const handed = passOnDraft.put(booking.id)
  let reached = false
  try {
    const failure = await router.push({ path: '/send', query: { art: SEND_TYPES.send } })
    reached = !failure
  } finally {
    if (!reached) passOnDraft.drop(handed)
  }
}

/** "Nicht jetzt": the line is answered, and the thank-you leaves the tile. */
const notNow = (booking) => {
  markSeen('pass-on', booking.id)
  leave(booking)
}

/**
 * "Antworten": the conversation with whoever thanked, by the address the reply button of a mail
 * has (`/contacts?with=…&community=…`). A missing community is this one.
 */
const answer = (booking) => {
  const { gradidoID, communityUuid } = booking.linkedUser ?? {}
  router.push({
    path: '/contacts',
    query: communityUuid ? { with: gradidoID, community: communityUuid } : { with: gradidoID },
  })
}

/** "Später": put aside on this device; the booking row is left as it is. */
const later = (booking) => {
  markSeen('arrival', booking.id)
  leave(booking)
}
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks, and a double slash is not a comment
   to it.

   The label stands on the tile's top edge, as on the matching tile below it -- and for the same
   reason the tile stands 12px lower, so that the label does not touch what is above it. */
.thanks-arrival-tile {
  position: relative;
  margin-top: 0.75rem;
}

.thanks-arrival-tile-label {
  position: absolute;
  top: -1rem;
  left: 50%;
  z-index: 1;
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  padding: 0.3rem 1.1rem 0.3rem 0.9rem;
  border-radius: 1rem;
  transform: translateX(-50%);
}

.thanks-arrival-tile-label svg {
  width: 1.5rem;
  height: 1.5rem;
}

.thanks-arrival-tile-box {
  padding-top: 2.25rem !important;
}

.thanks-arrival-tile-heading {
  text-wrap: balance;
}

.thanks-arrival-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* One thank-you a block, the next one under a thin line. */
.thanks-arrival-item {
  padding-top: 1rem;
}

.thanks-arrival-item + .thanks-arrival-item {
  margin-top: 0.75rem;
  border-top: 1px solid var(--bs-border-color, #dee2e6);
}

/* The face and what it says, side by side. ⛔ `min-width: 0` on the words: a flex item's least
   width is its content, and the message stands on one unbroken line. */
.thanks-arrival-item-head {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}

.thanks-arrival-item-face {
  flex: 0 0 auto;
}

.thanks-arrival-item-text {
  flex: 1 1 auto;
  min-width: 0;
}

/* The picture as small as in the opened booking row, 36 : 25 on the card's ground. */
.thanks-arrival-picture {
  margin-top: 0.5rem;
}

.thanks-arrival-picture-image {
  display: block;
  width: 132px;
  max-width: 100%;
  height: auto;
  aspect-ratio: 36 / 25;
  border-radius: 10px;
  background: #fbf3de;
  object-fit: cover;
}

/* The message as the closed booking row writes it: italic, in the muted colour of the row's other
   secondary lines, on one line with an ellipsis. ⛔ `contain: inline-size` for the reason the row
   gives: without it the FULL line counts as the least width of every flex parent up to the
   layout's content column, and a long message pushes the page apart. */
.thanks-arrival-memo {
  margin-top: 0.35rem;
  overflow: hidden;
  color: var(--bs-secondary-color, #6c757d);
  font-style: italic;
  text-overflow: ellipsis;
  white-space: nowrap;
  contain: inline-size;
}

/* The choice the whole width of the block, under the face as well: seven buttons a finger wide
   need it on a phone. On the menus' own grey, as in the opened booking row -- as wide as all
   forty-eight are, so that "mehr" changes its height and not its width. */
.thanks-arrival-react {
  margin-top: 0.85rem;
}

.thanks-arrival-react-choice {
  width: min(18.825rem, 100%);
  padding: 0.35rem;
  border: 1px solid var(--menu-border, #b3bac2);
  border-radius: 0.85rem;
  background: var(--menu-surface, #dde1e6);
}

@media (hover: none) {
  .thanks-arrival-react-choice {
    width: min(22.825rem, 100%);
  }
}

.thanks-arrival-pass-on {
  margin-top: 0.5rem;
}

/* The two quiet ways, at the right, side by side where they fit. */
.thanks-arrival-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.25rem 0.75rem;
  margin-top: 0.5rem;
}

.thanks-arrival-answer,
.thanks-arrival-later {
  min-height: 2rem;
  padding: 0.25rem 0.35rem;
  border: 0;
  background: transparent;
  font-size: 0.9rem;
  line-height: 1.3;
  cursor: pointer;
}

/* "Antworten" leads somewhere, in the colour of a link; "Später" puts aside, in the muted one. */
.thanks-arrival-answer {
  color: var(--bs-link-color, #0d6efd);
}

.thanks-arrival-later {
  color: var(--bs-secondary-color, #6c757d);
}

.thanks-arrival-answer:hover,
.thanks-arrival-later:hover {
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.thanks-arrival-answer:focus-visible,
.thanks-arrival-later:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}
</style>
