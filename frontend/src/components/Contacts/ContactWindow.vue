<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- A window over the list, not a jump into the send form (KF-010). A tap on a contact
       is somebody saying "this person", and what follows is the conversation with them, with
       the way to send them Gradido behind their name (E-031). -->
  <!-- ⛔ Not `centered`: a window in the middle grows in both directions when the thread lands,
       and what was under a finger moves up. At the top of the screen it grows downwards
       only (E-031).

       `fullscreen="sm"`: below Bootstrap's `sm` (576 px) the window is a sheet over the whole
       screen -- the head at the top, the compose bar at the bottom, the thread in between
       taking what is left (see the stylesheet). Measured in the installed bootstrap-vue-next:
       a string gives the dialog `modal-fullscreen-${value}-down`, and the wallet's CSS has
       `.modal-fullscreen-sm-down` under `(max-width: 575.98px)`.

       ⛔ `no-header` / `no-footer`, NOT `hide-header` / `hide-footer`. bootstrap-vue-next
       renamed both; the old names are accepted silently as plain attributes and do
       nothing, so the window came up with an empty header bar and an untranslated
       Cancel / OK pair under its own two buttons. Measured in the installed package:
       `noHeader`/`noFooter` are declared, `hideHeader`/`hideFooter` occur nowhere.
       `UserThankYouCard.vue` carries the same warning beside the same trap.

       `lazy`, like the heart's confirmation: without it a closed dialog stays rendered and
       teleported to the body -- here holding a 64px portrait and a contact.

       ⛔ And `aria-label`, BECAUSE of `no-header`. The dialog labels itself through its
       header -- `aria-labelledby` is bound only where there is one -- so dropping the
       header left this window with no accessible name at all: a screen reader announced
       "dialog" and nothing else, while the person's name existed only inside the body. -->
  <BModal
    :model-value="modelValue"
    fullscreen="sm"
    lazy
    no-header
    no-footer
    :aria-label="alias"
    body-class="contact-window-body"
    data-test="contact-window"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="contact" class="contact-window-inner">
      <!-- The cross at the very top, in a line of its own, and the name with its marks one
           line below it (Bernd, 24.09.2026): beside the name the cross took the room the name
           and its marks need -- on a phone the name was down to a few letters. The
           window could always be closed by clicking beside it, but that is a thing one has to
           know -- a cross is the one control everybody looks for (Bernd, 04.09.2026).

           ⛔ In the body, not by turning the header back on: BModal's header would bring a
           bar with a rule under it and its own padding.

           ⚠️ `$t('form.close')` as the accessible name, not the glyph: a screen reader
           reading "times" or nothing at all is what a bare × amounts to. -->
      <div class="contact-window-top">
        <button
          type="button"
          class="contact-window-close"
          :aria-label="$t('form.close')"
          :title="$t('form.close')"
          data-test="contact-window-close"
          @click="emit('update:modelValue', false)"
        >
          <IBiX />
        </button>
      </div>

      <div class="contact-window-head">
        <app-avatar :size="64" :color="'#fff'" v-bind="avatar" />
        <div class="contact-window-who">
          <!-- Behind the name, in this order (Bernd, E-031): the heart and the bell, two marks
               of one's own on this person that say how they stand. Both in the measure of the
               booking row (`gap-2`), and the name gives way (ellipsis) before either does. The
               coin that stood here third went under the figures, as a button with its word
               (Bernd, 24.09.2026, at the device: the coin alone was not taken for a button).

               The heart is the one of every list: the same component, the same look, the same
               question before it is taken away (E-030). -->
          <div class="contact-window-name-line">
            <div class="contact-window-name" data-test="contact-window-name">{{ alias }}</div>
            <favorite-heart class="contact-window-heart" :member="contact.user" />
            <!-- The bell: mutes this conversation for oneself -- no mails about their
                 messages; the thread shows them as before (E-024). Only where there is a
                 conversation: before the first message there is nothing to mute, and the
                 thread says when there is one. No question before switching, in either
                 direction: nothing is lost either way, and it switches back as easily
                 (unlike the heart, KF-003). -->
            <button
              v-if="chatConversation.exists"
              type="button"
              class="contact-window-mark contact-window-bell"
              :class="{ 'is-muted': muted }"
              :aria-pressed="muted ? 'true' : 'false'"
              :aria-label="bellName"
              :title="bellName"
              data-test="contact-window-bell"
              @click="toggleMute"
            >
              <i-mdi-bell-off-outline
                v-if="muted"
                class="contact-window-bell-icon"
                aria-hidden="true"
              />
              <i-mdi-bell-outline v-else class="contact-window-bell-icon" aria-hidden="true" />
            </button>
          </div>
          <div
            v-if="contact.user.communityName"
            class="contact-window-community"
            data-test="contact-window-community"
          >
            {{ contact.user.communityName }}
          </div>
          <!-- ⛔ Only where it can be built truthfully. The address is `host/u/alias`, and
               the host is the CONTACT's community -- which a contact row does not carry.
               For a member of this community it is ours; for anybody else the wallet would
               have to invent one, and an address that resolves to the wrong person is the
               exact failure `gradidoAddress` exists to prevent. The community line above
               already says they are from elsewhere. -->
          <div v-if="address" class="contact-window-address" data-test="contact-window-address">
            {{ address }}
          </div>
        </div>
      </div>

      <!-- The three numbers come from the same answer as the list: oldest booking, how
           many, newest booking.

           ⛔ Only where they are. Opened from a booking row the window stands on what that
           row carries, and a single booking knows nothing about how many there were in
           all -- the figures arrive a moment later, from the lookup useContactWindow makes
           (`openMember`). Until then the line is empty rather than guessed: `new Date(
           undefined)` prints "Invalid Date" and a plural rule handed no number throws.

           ⚠️ And the line keeps its HEIGHT while it is empty -- see the stylesheet. Letting
           it collapse moved what stands under it up by a line and then dropped it back down
           as the answer landed, under a finger already on its way there.

           ⛔ ONE link over the two figures, not one each. Narrowed to this member the
           newest booking IS the top row of the list, so "how many" and "when was the last"
           lead to the same place -- two links would have been two names for one door.
           "Since when" leads nowhere and stays plain text. (Bernd, 04.09.2026.)

           The separator carries its OWN spaces, in its own element, and nothing here relies
           on the whitespace between the elements: Vue's `whitespace: 'condense'` does not
           collapse a whitespace-only node with a newline in it to one space, it deletes it.
           The spec reads the rendered text back for exactly that. -->
      <div class="contact-window-meta" data-test="contact-window-meta">
        <template v-if="counted">
          <span>{{ metaSince }}</span>
          <!-- ⛔ Only where there are bookings. Somebody who came here over this member is
               a contact from that moment, and the list behind this link would be EMPTY --
               a door onto nothing, under a number that would have read "0 bookings". The
               server agrees: narrowed to that person the booking list has no rows. -->
          <template v-if="hasBookings">
            <span>{{ CONTACT_META_SEPARATOR }}</span>
            <router-link
              :to="bookingsRoute"
              class="contact-window-bookings"
              data-test="contact-window-bookings"
              @click="closeWhenNavigating"
            >
              {{ metaBookings }}
            </router-link>
          </template>
        </template>
        <!-- What made the two of them contacts, where it was not a booking -- a quiet line
             of its own UNDER the figures, not instead of them. A contact can have both. -->
        <div v-if="originLine" class="contact-window-origin" data-test="contact-window-origin">
          {{ originLine }}
        </div>
      </div>

      <!-- Sending Gradido, the one way out of this window: the map profile's button
           (MatchProfile) with its word and its white coin, in the gold of the compose bar's
           send button instead of the map's teal (Bernd, 24.09.2026). Under the figures and
           above the line where the thread begins. No "Send e-mail" beside it: the short mail is
           the compose bar's box, the one with a subject the send form's other tab (E-031). -->
      <div class="contact-window-send">
        <button
          type="button"
          class="send-btn send-gradido"
          data-test="contact-window-send"
          @click="toSend"
        >
          <img src="/img/svg/gdd_coin_sw.svg" class="send-coin" alt="" aria-hidden="true" />
          {{ $t('contacts.sendGradido') }}
        </button>
      </div>

      <!-- The conversation, where "conversation history -- comes with the chat" stood
           (E-023, KF-010), with the line to write in under it (P3). There as soon as the pair
           is: opened from a booking row, before the lookup for the figures answers
           (useContactWindow.openMember). It tells the window what it learned about the
           conversation -- whether there is one, and whether it is muted -- for the bell.

           ⛔ Keyed by the pair. The thread takes its person once, when it is made; should the
           window ever be handed another person while it stands open, a new key makes a new
           thread instead of leaving one person's messages under another's name. -->
      <chat-thread
        v-if="contact.user?.gradidoID"
        :key="threadKey"
        class="contact-window-thread"
        :member="contact.user"
        :alias="alias"
        @chat-conversation="takeChatConversation"
      />
    </div>
  </BModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import { BModal } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatThread from '@/components/Chat/ChatThread.vue'
import FavoriteHeart from '@/components/FavoriteHeart.vue'
import {
  CONTACT_META_SEPARATOR,
  contactBookingsMeta,
  contactDisplay,
  contactOriginLine,
} from '@/components/Contacts/contactDisplay'
import { setChatConversationMuted } from '@/graphql/chat.graphql'
import { useAppToast } from '@/composables/useToast'
import { gradidoAddress } from '@/utils/gradidoAddress'
import { SEND_TYPES } from '@/utils/sendTypes'
import { bookingsWithMemberRoute } from '@/utils/bookingsRoute'

/**
 * One contact, opened from wherever a contact stands: the list, the column, the strip.
 *
 * One window per LIST rather than one per row -- a modal per row would build one hidden
 * dialog for every person on screen, which is the reason the heart's own confirmation is
 * `lazy`.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** What contactListQuery delivers: `{ user, firstAt, lastAt, bookings }`. */
  contact: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const { t, d } = useI18n()
const router = useRouter()
const { toastSuccess, toastError } = useAppToast()
const { mutate: saveMuted } = useMutation(setChatConversationMuted)

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
 * compares it.
 *
 * ⚠️ A `communityUuid` that arrives later than the member (null from the row, the uuid from
 * the lookup) makes a new key, so the thread is asked for once more. That is the server's
 * same conversation both times -- null IS this community there -- and moving the read
 * pointer twice to the same place changes nothing.
 */
const threadKey = computed(() => {
  const user = props.contact?.user
  return `${(user?.communityUuid ?? '').toLowerCase()}/${(user?.gradidoID ?? '').toLowerCase()}`
})

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
  if (!props.contact?.homeCommunity) return ''
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
  counted.value
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
const hasBookings = computed(() => counted.value && props.contact.bookings > 0)

/** How many and how recently -- the part that leads to those bookings; the row's line. */
const metaBookings = computed(() =>
  counted.value ? contactBookingsMeta(props.contact, { t, d }) : '',
)

/**
 * What made the two of them contacts, where it was not a booking.
 *
 * Not behind `counted`: the origin travels with the row and does not have to wait for the
 * figures. Where both are there both lines are shown -- somebody who came here over this
 * member and has since sent them Gradido is one contact with a count and an origin.
 */
const originLine = computed(() => (props.contact ? contactOriginLine(props.contact, { t }) : ''))

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
const closeWhenNavigating = (event) => {
  if (event.defaultPrevented) {
    emit('update:modelValue', false)
  }
}

/**
 * The button: the send form with this person already named, as the profile window on the map
 * opens it. The e-mail with a subject is the form's other tab (E-031).
 *
 * ⚠️ A member of another community goes down the same road: the send form is what knows
 * the federation branch, and a second way of reaching it here would be a second place for
 * that knowledge to drift.
 */
const toSend = () => {
  const community = props.contact?.user?.communityUuid
  const user = props.contact?.user?.gradidoID
  if (!community || !user) return
  emit('update:modelValue', false)
  // ⛔ The mode is named although there is only this one way left. This window stands beside
  // /send, so a tap here changes only the params and the query -- the form is patched, not
  // rebuilt -- and without `art` a form that was already in e-mail mode would stay there.
  router.push({ path: `/send/${community}/${user}`, query: { art: SEND_TYPES.send } })
}

/**
 * What the thread has learned about the conversation (`ChatThread`, event `chatConversation`).
 * Nothing is known before it has: no bell until then.
 */
const chatConversation = ref({ exists: false, mutedByMe: false })

/** The bell's state: one's own mark on this conversation, as the member switched it last. */
const muted = ref(false)

const takeChatConversation = ({ exists, mutedByMe }) => {
  chatConversation.value = { exists, mutedByMe }
  muted.value = mutedByMe
}

/**
 * Counted up with every conversation the window comes to. The window stays while the person
 * in it changes (only the thread is made anew), so an answer about the bell that comes back
 * after the window moved to someone else is about someone else: it changes nothing here and
 * holds up nothing here (coderabbit, PR #3974).
 */
let contactGeneration = 0
let mutingInFlight = false

// Another conversation -- the pair the thread is keyed by (`threadKey`), so the same id in
// another community is another one: nothing of the last one's bell stays up while the new
// thread is asking. A `communityUuid` that arrives later makes a new key as well; the new
// thread says the bell's state anew, and as the bell sends the state it wants and not a flip,
// a second press after a dropped answer does no harm.
// ⚠️ A window that only closed (useContactWindow lets the contact go) is no other person: the
// answer on its way still says what became of the person just seen.
watch(
  () => threadKey.value,
  () => {
    takeChatConversation({ exists: false, mutedByMe: false })
    if (!props.contact?.user?.gradidoID) return
    contactGeneration += 1
    mutingInFlight = false
  },
)

const bellName = computed(() =>
  muted.value ? t('chatThread.muteOff', { name: alias.value }) : t('chatThread.muteOn'),
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
  if (mutingInFlight) return
  mutingInFlight = true
  const generation = contactGeneration
  const wanted = !muted.value
  const name = alias.value
  muted.value = wanted
  try {
    const answer = await saveMuted({ ref: memberRef.value, muted: wanted })
    if (generation !== contactGeneration) return
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
    if (generation !== contactGeneration) return
    muted.value = !wanted
    toastError(error.message)
  } finally {
    if (generation === contactGeneration) mutingInFlight = false
  }
}
</script>

<style lang="scss" scoped>
/* The cross's own line, at the top right. ⚠️ In the flow, not absolutely positioned: out of
   the flow the name beside it laid out straight through the space the cross took, and the
   head had to reserve that space at its right (2.8rem at the end, more than a phone could
   spare). Pulled up and right into the body's padding, so it sits near the corner and the
   line costs little height. */
.contact-window-top {
  display: flex;
  justify-content: flex-end;
  margin: -0.5rem -0.5rem 0.25rem 0;
}

.contact-window-close {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 1.15rem;
  line-height: 1;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
}

.contact-window-close:hover,
.contact-window-close:focus-visible {
  color: var(--bs-body-color);
}

/* To the right edge: the cross stands on the line above. */
.contact-window-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.contact-window-who {
  flex: 1;
  min-width: 0;
}

.contact-window-name {
  min-width: 0;
  font-weight: 700;
  font-size: 1.1rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-window-community,
.contact-window-address {
  font-size: 0.8rem;
  color: var(--bs-secondary-color, #6c757d);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ⚠️ `min-height`, and it is not decoration: the line is empty while the figures behind it
   are still being fetched (see the template). Without a reserved line everything under it
   sat a line higher and jumped down the moment the answer arrived -- past a finger already
   reaching for it (the two send buttons, when they stood there; the thread and its compose
   bar now). One line of this element's own line-height. */
.contact-window-meta {
  font-size: 0.8rem;
  color: var(--bs-secondary-color, #6c757d);
  margin: 0.75rem 0 1rem;
  min-height: 1.5em;
}

/* A line of its own under the figures. ⚠️ The container keeps its `min-height` above, which
   is what stops the block collapsing while the figures are still on their way and moving
   what is under it. What it cannot promise is one line: a contact with bookings AND an
   origin has two, and both arrive together. */
.contact-window-origin {
  margin-top: 0.15rem;
}

/* The link sits inside the muted meta line, so it takes that line's size and colour rather
   than the theme's link blue; the underline is what says it leads somewhere. */
.contact-window-bookings {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* The name and the marks behind it, in the measure of the booking row (`gap-2` there,
   the same 0.5rem). The name gives way (ellipsis) before a mark does: it may shrink to
   nothing, the marks may not shrink at all. */
.contact-window-name-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.contact-window-heart {
  flex: 0 0 auto;
}

/* The bell: round, the heart's glyph size inside (1.35em, as FavoriteHeart draws it). A
   plain button, so it carries its own focus ring. */
.contact-window-mark {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted, #6c757d);
  line-height: 1;
}

.contact-window-mark:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.contact-window-bell-icon {
  width: 1.35em;
  height: 1.35em;
}

/* Muted: struck through AND set on a ground, so the state shows without a word -- the light
   gold of one's own messages with its gold rim; the glyph in the body colour, which is what
   reads on that ground in both modes. */
.contact-window-bell.is-muted {
  border-color: var(--gold, #c58d38);
  background: rgb(197 141 56 / 18%);
  color: var(--bs-body-color);
}

/* The one way out, under the figures and above the line where the thread begins. */
.contact-window-send {
  display: flex;
}

/* ⛔ From here to the focus rule: the map profile's button (MatchProfile.vue), rule for rule,
   in the compose bar's gold instead of the map's teal (Bernd, 24.09.2026) -- the one
   difference. ContactWindow.spec holds both: the rules against MatchProfile with the colour
   swapped, the colour against ChatComposeBar's send button. */
.send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  padding: 10px 14px;
  border-radius: 26px;
  font-size: 15px;
  font-weight: 700;
  border: 1.5px solid #c08935;
  white-space: nowrap;
}

.send-gradido {
  background: #c08935;
  color: #fff;
}

.send-coin {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  filter: brightness(0) invert(1);
}

/* Without Bootstrap's `.btn` a plain button has no focus ring of its own, and this is the
   window's one way out. */
.send-btn:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

/* ⛔ The sheet (below `sm`, where BModal makes the window fullscreen -- the same 575.98px as
   Bootstrap's `.modal-fullscreen-sm-down`): the window's inside becomes one column over the
   whole height -- head, figures, then the thread taking what is left, with the compose bar at
   its bottom -- so nothing hangs below the screen and the page behind never scrolls. The
   thread grows upwards from the bar and scrolls inside. `height: 100%` resolves against the
   modal body, which is a flexed item of a column of definite height. */
@media (width <= 575.98px) {
  .contact-window-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .contact-window-thread {
    flex: 1 1 auto;
  }

  .contact-window-thread :deep(.chat-thread-scroll) {
    max-height: none;
  }
}
</style>
