<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="show-friends">
    <p class="mb-4 page-text" data-test="show-friends-lead">{{ $t('showFriends.page.lead') }}</p>
    <h2 class="h4 mb-3 page-text" data-test="show-friends-question">
      {{ $t('showFriends.page.question') }}
    </h2>

    <section class="door bg-white app-box-shadow gradido-border-radius mb-3">
      <button
        type="button"
        class="door-head"
        :aria-expanded="isHereOpen"
        aria-controls="show-friends-here"
        data-test="show-friends-here-head"
        @click="toggle(HERE)"
      >
        <IMdiCoffeeOutline class="door-icon" />
        <span class="door-title">{{ $t('showFriends.here.title') }}</span>
        <IMdiChevronUp v-if="isHereOpen" />
        <IMdiChevronDown v-else />
      </button>
      <div v-if="isHereOpen" id="show-friends-here" class="door-body" data-test="show-friends-here">
        <own-code-view :title="$t('pageTitle.my-gradido-card')" :link="link" :show-head="false">
          <!-- Only a confirmed member vouches (E-018): until then the card, without a stamp. -->
          <p
            v-if="!confirmed"
            class="door-hint small mt-3 mb-0"
            data-test="show-friends-confirm-first"
          >
            {{ $t('showFriends.here.confirmFirst') }}
          </p>
          <!-- A code, or the way back to one after a failed fetch, a request that hangs or a
               full limit. Where the server has no code for this member there is neither: the
               card, without a word. -->
          <div v-if="presence || noAnswer" class="mt-3" data-test="show-friends-presence">
            <p v-if="presence?.code" class="mb-2" data-test="show-friends-valid-for">
              {{
                presenceExpired
                  ? $t('showFriends.here.expired')
                  : $t('showFriends.here.validFor', minutesLeft)
              }}
            </p>
            <BButton
              variant="outline-secondary"
              :disabled="busy"
              data-test="show-friends-new-code"
              @click="newCode"
            >
              {{ $t('showFriends.here.newCode') }}
            </BButton>
            <p
              v-if="presence?.code"
              class="door-hint small mt-2 mb-0"
              data-test="show-friends-code-hint"
            >
              {{ $t('showFriends.here.codeHint') }}
            </p>
            <p
              v-else-if="limitReached"
              class="door-hint small mt-2 mb-0"
              data-test="show-friends-limit-reached"
            >
              {{ $t('showFriends.here.limitReached', { n: unconfirmedGuests.length }) }}
            </p>
            <p v-else class="door-hint small mt-2 mb-0" data-test="show-friends-no-answer">
              {{ $t('showFriends.here.noAnswer') }}
            </p>
            <!-- ZE-013: the guest without a phone of their own opens the account on this device.
                 Only under a code that is still good - it is that code the form opens with. -->
            <template v-if="presence?.code && !presenceExpired">
              <BButton
                variant="link"
                class="p-0 mt-3"
                data-test="show-friends-no-phone"
                @click="noPhone"
              >
                {{ $t('showFriends.here.noPhone') }}
              </BButton>
              <p class="door-hint small mt-1 mb-0" data-test="show-friends-no-phone-hint">
                {{ $t('showFriends.here.noPhoneHint') }}
              </p>
            </template>
          </div>
          <!-- E-020: the member's own guests who have not confirmed yet, by name - who they are is
               what the member needs to remind them, and what support needs to find a dead one.
               ZE-014: folded to their number, because this is the screen the member holds out to
               a stranger. The names are not in the page until the member taps the line. -->
          <div
            v-if="unconfirmedGuests.length"
            class="door-guests small mt-3"
            data-test="show-friends-unconfirmed"
          >
            <button
              type="button"
              class="door-guests-head"
              :aria-expanded="isGuestsOpen"
              aria-controls="show-friends-unconfirmed-list"
              data-test="show-friends-unconfirmed-toggle"
              @click="isGuestsOpen = !isGuestsOpen"
            >
              <span class="door-guests-count">
                {{ $t('showFriends.here.unconfirmedGuests', unconfirmedGuests.length) }}
              </span>
              <IMdiChevronUp v-if="isGuestsOpen" />
              <IMdiChevronDown v-else />
            </button>
            <div v-if="isGuestsOpen" id="show-friends-unconfirmed-list">
              <ul class="mb-1">
                <li
                  v-for="guest in unconfirmedGuests"
                  :key="`${guest.alias}-${guest.createdAt}`"
                  data-test="show-friends-unconfirmed-guest"
                >
                  {{
                    $t('showFriends.here.unconfirmedGuest', {
                      firstName: guest.firstName ?? '',
                      lastName: guest.lastName ?? '',
                      alias: guest.alias ?? '',
                      date: d(new Date(guest.createdAt), 'short'),
                    })
                  }}
                </li>
              </ul>
              <p class="door-hint mb-0" data-test="show-friends-unconfirmed-hint">
                {{ $t('showFriends.here.unconfirmedHint') }}
              </p>
            </div>
          </div>
          <!-- The plain address, also under a code with a stamp: it is what a guest types or
               copies, and the stamp belongs on this screen only. -->
          <div v-if="alias" class="small mt-3" data-test="show-friends-address">
            <gradido-address-copy :alias="alias" />
          </div>
          <ol class="door-steps mt-4 mb-0" data-test="show-friends-steps">
            <!-- The map exists only where matching is switched on; a step that sends somebody
                 to a place the wallet does not have would be a sentence nobody can follow.
                 The word carries the link, like "here" in the first creation: right under the
                 member's own card, "the map" alone would read as the code above it. -->
            <li v-if="hasMap" data-test="show-friends-step-map">
              <i18n-t keypath="showFriends.here.step1" tag="span" scope="global">
                <template #map>
                  <RouterLink to="/matching/karte" data-test="show-friends-map">
                    {{ $t('showFriends.here.map') }}
                  </RouterLink>
                </template>
              </i18n-t>
            </li>
            <li>{{ $t('showFriends.here.step2') }}</li>
            <li>{{ $t('showFriends.here.step3') }}</li>
          </ol>
        </own-code-view>
      </div>
    </section>

    <section class="door bg-white app-box-shadow gradido-border-radius mb-3">
      <button
        type="button"
        class="door-head"
        :aria-expanded="isAwayOpen"
        aria-controls="show-friends-away"
        data-test="show-friends-away-head"
        @click="toggle(AWAY)"
      >
        <IMdiEmailOutline class="door-icon" />
        <span class="door-title">{{ $t('showFriends.away.title') }}</span>
        <IMdiChevronUp v-if="isAwayOpen" />
        <IMdiChevronDown v-else />
      </button>
      <div v-if="isAwayOpen" id="show-friends-away" class="door-body" data-test="show-friends-away">
        <p>
          <strong>{{ $t('showFriends.away.thanks') }}</strong>
          {{ $t('showFriends.away.thanksText') }}
        </p>
        <!-- Until the thank-you greeting has a form of its own, the thank-you is a link: the
             send form, opened on its link, cheque and QR tab. -->
        <BButton
          variant="gradido"
          :to="{ path: '/send', query: { art: SEND_TYPES.link } }"
          data-test="show-friends-thanks"
        >
          {{ $t('send_per_link') }}
        </BButton>

        <template v-if="alias">
          <p class="small mt-4 mb-2">{{ $t('showFriends.away.addressLead') }}</p>
          <!-- Exactly what goes out, so what the member reads here is what arrives. -->
          <blockquote class="door-quote" data-test="show-friends-share-text">
            {{ addressText }}
          </blockquote>
          <BButton variant="outline-secondary" data-test="show-friends-share" @click="shareAddress">
            <IBiShare class="me-2" />
            {{ $t('showFriends.away.shareButton') }}
          </BButton>
          <p class="door-hint small mt-2 mb-0">{{ $t('showFriends.away.editHint') }}</p>
        </template>
      </div>
    </section>

    <p class="mt-4 page-text" data-test="show-friends-footer">
      <strong>{{ $t('showFriends.page.footerLead') }}</strong>
      {{ $t('showFriends.page.footer') }}
    </p>
  </div>
</template>

<script setup>
/**
 * Showing Gradido to somebody: one question, two doors.
 *
 * The page asks "whom?" -- one person with a name, not "friends" in the plural -- and answers
 * with two ways. The first is open on arrival, because the table is the usual case and every
 * tap between deciding and holding up the code is one too many.
 *
 * ## The first door is the member's own card, with a table code in its link
 *
 * The same address as the card page (`MyGradidoCard`), drawn by the same view. Whoever scans it
 * lands on the public page behind the address, which says who shows them Gradido and offers to
 * open an account.
 *
 * Here the link also carries a signed stamp, `?presence=` (E-017, ZE-012). The public page hands
 * it on to the registration, and whoever registers within ten minutes may choose a password
 * there and use the account at once. One code per guest is the button under it; the server
 * remembers none of them, it checks the seal and the clock. Once a code has run out it leaves
 * the screen, and the button stays. The card page, the printed card and the shared address carry
 * no stamp - they stay the normal way in, with the mail link.
 *
 * Where the server has no code for the member - no user name - the card is the address of
 * before, without a message: that is still a way in. Where a code cannot be had - no
 * connection, a request that hangs, an account locked after its grace period - the card falls
 * back to the address as well, and the button stays for a new try.
 *
 * Only a confirmed member vouches (E-018): an unconfirmed one does not ask and shows the card
 * with a sentence saying why. A member vouches for a limited number of guests who have not
 * confirmed (E-019, `PRESENCE_MAX_UNCONFIRMED` in the backend); they are listed under the code by
 * name (E-020), folded to their number until the member taps it (ZE-014), and at the limit the
 * server mints no code - the card, the reason, the folded list, and the button to ask again.
 *
 * Under a code that is still good, a guest without a phone of their own is offered this device
 * (ZE-013): the member is signed out, and the form opens with a fresh code, as if it had been
 * scanned.
 *
 * ## The second door is for somebody elsewhere
 *
 * A thank-you first -- whoever thanks gives something, whoever invites wants something. Until
 * the thank-you greeting is built it is the link from the send form. Under it the address
 * alone, with a sentence around it, handed to the device's share sheet.
 *
 * Nothing here is stored. The page reads the member's name from the store like the card page
 * does, and asks the server for nothing but the table code - and, for the guest without a phone,
 * to sign the member out.
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { loadRouteLocation, useRouter } from 'vue-router'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton } from 'bootstrap-vue-next'
import OwnCodeView from '@/components/QrCode/OwnCodeView'
import GradidoAddressCopy from '@/components/GradidoAddressCopy'
import { useAppToast } from '@/composables/useToast'
import { useShowFriendsSeen } from '@/composables/useShowFriendsSeen'
import CONFIG from '@/config'
import { logout } from '@/graphql/mutations'
import { presenceCode as presenceCodeQuery } from '@/graphql/presenceCode.graphql'
import { gradidoAddress, memberAlias } from '@/utils/gradidoAddress'
import { SEND_TYPES } from '@/utils/sendTypes'
import { shareText } from '@/utils/shareText'

const HERE = 'here'
const AWAY = 'away'

const store = useStore()
const router = useRouter()
const { t, d } = useI18n()
const { mutate: logoutMutation } = useMutation(logout)

/**
 * Having been here once is what turns the tile on the overview from the large invitation
 * into a quiet row (ZE-008 W5). Remembered on opening rather than on any action taken
 * here: the member came, looked and decided -- that is the answer the tile asked for.
 */
const { markSeen } = useShowFriendsSeen()
onMounted(markSeen)
const toast = useAppToast()

const hasMap = CONFIG.MATCHING_ACTIVE === true

// gradidoID with a capital D, as the store spells it (see MyGradidoCard).
const alias = computed(() => memberAlias(store.state.username, store.state.gradidoID))

/**
 * Only a confirmed member vouches (E-018): the server refuses the others at once, so a member
 * the store knows as unconfirmed does not ask and shows the card without a stamp. Unknown
 * (`null`, a session from before the field) asks - the server decides.
 *
 * A computed, not a plain read: the store's copy is renewed on every pass through
 * `/authenticate` (the guard dispatches `login` with the `verifyLogin` answer), and a member
 * who confirms their address mid-session must not stay locked out of their own code on a page
 * that is still mounted. It also keeps `enabled` below a ref, which is what it is read as.
 */
const confirmed = computed(() => store.state.emailChecked !== false)

/**
 * The table code, fresh on every visit (`network-only`: the query takes no argument, so a cached
 * answer could be another member's, or a code long run out). The answer is null where the
 * server has no code for this member (no user name) -- an answer, not a failure.
 */
const {
  result: presenceResult,
  error: presenceError,
  loading: presenceLoading,
  refetch: refetchPresence,
} = useQuery(presenceCodeQuery, null, { fetchPolicy: 'network-only', enabled: confirmed })

// ⚠️ After a failed refetch the previous answer is still in `result` -- the error decides.
const presence = computed(() =>
  presenceError.value ? null : (presenceResult.value?.presenceCode ?? null),
)

// A failed refetch shows as the fallback card through `error`; the rejection itself is not news.
const newCode = () => {
  askedAt.value = now.value
  return refetchPresence()?.catch(() => {})
}

/**
 * ZE-013: a guest without a phone of their own opens the account here, on this device. One tap:
 * a fresh code (the full ten minutes - once signed out, the member can mint none), the member
 * signed out as the header does it, then the form with the code the guest would have scanned.
 * The name is the one in the answer, the name the code is sealed for, not the store's copy (see
 * `link`). Without a code in the fresh answer - the limit filled up meanwhile - nothing happens,
 * and the page says why.
 *
 * ⚠️ The form is loaded BEFORE signing out, not by the navigation after it. Once the token is
 * gone, the header's session timer (`SessionLogoutTimeout`, a tick a second) signs out a second
 * time and sends the page to /login, and while the form's chunk was still on its way its tick
 * could fall in between. `loadRouteLocation` puts the loaded form into the route, so the push
 * after the sign-out waits for no network, and the header is gone before the timer ticks again.
 */
const noPhone = async () => {
  const answer = await refetchPresence()?.catch(() => null)
  const fresh = answer?.data?.presenceCode
  if (!fresh?.code) return
  const form = { path: '/register', query: { referrer: fresh.alias, presence: fresh.code } }
  // Without the form - no connection - nobody is signed out, and the member can tap again.
  if (!(await loadRouteLocation(router.resolve(form)).catch(() => null))) return
  try {
    await logoutMutation()
  } catch {
    // As in the header: signed out here all the same when the server does not answer.
  }
  await store.dispatch('logout')
  await router.push(form)
}

/**
 * Counting down in whole minutes, "one more minute" included, from the moment the code
 * arrived: `remainingMs` is what the server had left when it minted the code, so this device's
 * clock never has to agree with the server's. Against the clock, one running ten minutes fast
 * would take every fresh code for an expired one and show no code at all. Ticks every second so
 * that the line turns to "expired" when the code does.
 */
const now = ref(Date.now())
let ticker = null
onMounted(() => {
  ticker = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onUnmounted(() => clearInterval(ticker))
// Kept per code, not per answer: after a failed refetch the old answer shows again while the
// next one is on its way, and it must not count from ten once more. The arrival is the clock
// reading the count runs against, so the first count is exactly `remainingMs`. Immediate, so
// that an answer already there when the page opens has its arrival too.
const arrival = ref({ code: null, at: 0 })
watch(
  presence,
  (answer) => {
    if (answer?.code && answer.code !== arrival.value.code) {
      arrival.value = { code: answer.code, at: now.value }
    }
  },
  { immediate: true },
)
const msLeft = computed(() =>
  presence.value?.code ? arrival.value.at + presence.value.remainingMs - now.value : 0,
)
const presenceExpired = computed(() => msLeft.value <= 0)
const minutesLeft = computed(() => Math.ceil(msLeft.value / 60000))

// E-019: at the limit of unconfirmed guests the answer carries no code, only the guests (E-020).
const limitReached = computed(() => !!presence.value && !presence.value.code)
const unconfirmedGuests = computed(() => presence.value?.unconfirmedGuests ?? [])

/**
 * ZE-014: the guests' names only on a tap, folded again on the next. Kept while the page stands -
 * a new code leaves the list as it is - and stored nowhere: every visit starts folded.
 */
const isGuestsOpen = ref(false)

/**
 * The first answer may hang -- a connection that neither answers nor fails. After a few seconds
 * the card of before steps in, as it does after a failure; a code that still arrives takes its
 * place. Measured with the ticker, so it needs no timer of its own.
 */
const FIRST_ANSWER_WAIT_MS = 5000
const openedAt = Date.now()
const waitedTooLong = computed(() => now.value - openedAt >= FIRST_ANSWER_WAIT_MS)

// An answer arrived, whatever it said. `null` is one of them - the server has no code for this
// member - and it is the one case that gets the card without a word (E-017), so it has to be
// told apart from "nothing came back yet".
const answered = computed(() => presenceResult.value !== undefined)

/**
 * No code, and not because the server said so: the request failed, or the first one has been on
 * its way too long. Then the member gets a word and the button, instead of a button on its own.
 * Never for an unconfirmed member: nothing was asked, so no answer is missing - the page says
 * why there is no code, and a new try would ask nothing either.
 */
const noAnswer = computed(
  () =>
    confirmed.value &&
    !presence.value &&
    (!!presenceError.value || (waitedTooLong.value && !answered.value)),
)

/**
 * The button rests while a request is out, but not for ever: a refetch that hangs never clears
 * `loading` - @vue/apollo-composable only does that on a delivered result or error - and the
 * member would be left watching their code count down to "expired" next to a button they can
 * no longer press. Measured with the same ticker, so it needs no timer of its own.
 */
const askedAt = ref(openedAt)
const busy = computed(
  () => presenceLoading.value && now.value - askedAt.value < FIRST_ANSWER_WAIT_MS,
)

// No alias, no address: for the instant before the login answer has landed, an address built
// then would read `host/u/` -- nobody in it.
const address = computed(() => (alias.value ? gradidoAddress(alias.value).link : ''))

/**
 * The code's link, behind the name the code is sealed for: the store's copy of the name can be
 * stale (renamed on another device), and a link with another name opens nothing. A code that has
 * run out is taken off the screen (Bernd, 22.09.2026): nobody should scan what can no longer open
 * an account -- the button brings the next one.
 *
 * Without a code it is the address of before: the member is not confirmed yet, the server has
 * none for them (no user name, or the limit of unconfirmed guests), could not be reached, or is
 * taking too long. Only for the first few seconds, while the first answer is on
 * its way, there is no picture, so the one under a camera already pointed at it does not change a
 * moment later.
 */
const link = computed(() => {
  if (!alias.value) return ''
  if (!confirmed.value) return address.value
  if (presence.value?.code) {
    return presenceExpired.value
      ? ''
      : gradidoAddress(presence.value.alias, { presence: presence.value.code }).link
  }
  return answered.value || presenceError.value || waitedTooLong.value ? address.value : ''
})

// ⛔ The plain address, never the code's link: what is shared travels on and is read later, and
// a shared link carries no table code (E-017).
const addressText = computed(() => t('showFriends.away.shareText', { url: address.value }))

/**
 * One door open at a time, and either may be closed again. The first is open on arrival.
 */
const openDoor = ref(HERE)
const isHereOpen = computed(() => openDoor.value === HERE)
const isAwayOpen = computed(() => openDoor.value === AWAY)

const toggle = (door) => {
  openDoor.value = openDoor.value === door ? null : door
}

/**
 * The sentence and the address, to the share sheet; copied where the device has none.
 *
 * Copying says "copied" only once it is copied, for the reason `GradidoAddressCopy` gives: in
 * some browsers built into other apps there is no clipboard at all, and the call throws.
 */
const copyAddressText = async () => {
  try {
    await navigator.clipboard.writeText(addressText.value)
    toast.toastSuccess(t('showFriends.away.copied'))
  } catch {
    toast.toastError(t('gradidoid-not-copied'))
  }
}

const shareAddress = () => shareText(addressText.value, copyAddressText)
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it -- the build fails with "Invalid empty selector". */

/* The whole head is the button, so the door opens wherever it is touched. It brings none of
   a button's looks with it: colour and font come from the page. */
.door-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.25rem;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: start;
}

.door-icon {
  flex-shrink: 0;
  font-size: 1.4rem;
}

.door-title {
  flex: 1;
}

.door-body {
  padding: 0 1.25rem 1.25rem;
}

/* The steps are read at the table, so left-aligned like any list, even though the code
   above them is centred by its own view. */
.door-steps {
  text-align: start;
  padding-inline-start: 1.25rem;
}

.door-steps li + li {
  margin-top: 0.4rem;
}

/* The guests are read line by line, like the steps, under the centred code. */
.door-guests {
  text-align: start;
}

.door-guests ul {
  padding-inline-start: 1.25rem;
}

/* ZE-014: the line with the number is the button that unfolds the names, built like the door
   heads - it can be touched anywhere along it, and it brings none of a button's looks. */
.door-guests-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.25rem 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
}

.door-guests-count {
  flex: 1;
}

/* The message as it goes out: its own lines, and a link that may break anywhere rather than
   run out of the card on a phone. No background of its own, so it reads in both themes. */
.door-quote {
  margin: 0 0 1rem;
  padding: 0.5rem 0.75rem;
  border-inline-start: 3px solid var(--bs-border-color, #dee2e6);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.door-hint {
  color: var(--bs-secondary-color, #6c757d);
}
</style>
