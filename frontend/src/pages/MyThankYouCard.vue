<!-- AI-GENERATED — not an architecture reference -->
<template>
  <own-code-view :title="$t('pageTitle.my-thank-you-card')" :link="link">
    <template #above>
      <!-- The label first, as on the paper: it is the answer to "which of my cards is
           this", and it is the only thing the card says about itself. -->
      <div v-if="activeCard" class="fs-4 mb-3" data-test="my-thank-you-card-label">
        {{ activeCard.label }}
      </div>
    </template>

    <template v-if="activeCard">
      <div v-if="community" class="small text-muted mt-2" data-test="my-thank-you-card-community">
        {{ community }}
      </div>
      <!-- Big, not a footnote. This is the one sentence somebody reads while holding the
           phone out to a stranger, so it has to land at arm's length. (Bernd, 21.08.2026) -->
      <div class="fs-5 mt-4">{{ $t('my-codes.thank-you-card.hint') }}</div>
    </template>

    <!-- ⛔ Ahead of the two below, and that is the whole point of it: a question that never
         got an answer must not be reported as the answer "no". Without this the page would
         say "not set up yet" to somebody whose card exists and whose connection dropped --
         at a counter, with the phone already held out. -->
    <div v-else-if="failed" data-test="my-thank-you-card-failed">
      <p class="mt-3">{{ $t('my-codes.thank-you-card.failed') }}</p>
      <BButton variant="gradido" data-test="my-thank-you-card-retry" @click="retry">
        {{ $t('my-codes.thank-you-card.retry') }}
      </BButton>
    </div>

    <!-- Nothing to show yet. Two different reasons, and they need different sentences:
         the card function is off, or it is on and no card has been made. Both end at the
         same place, so both get the same way there. -->
    <div v-else-if="answered" data-test="my-thank-you-card-none">
      <p v-if="settings" class="mt-3">{{ $t('my-codes.thank-you-card.no-card') }}</p>
      <p v-else class="mt-3">{{ $t('my-codes.thank-you-card.not-set-up') }}</p>
      <BButton
        variant="gradido"
        to="/settings/thank-you-card"
        data-test="my-thank-you-card-settings"
      >
        {{ $t('my-codes.thank-you-card.to-settings') }}
      </BButton>
    </div>
  </own-code-view>
</template>

<script setup>
/**
 * "Somebody takes payment from me": the member's own thank-you card, on the screen.
 *
 * ## It gives nothing away that the paper does not
 *
 * The code is a bearer token, and showing it here is the same act as holding up the
 * printed card -- which is what it is for, on the day the card is at home. What protects
 * it is unchanged and does not sit on the code: the PIN is typed by the owner, the limits
 * cap what one payment and one day can cost, and three wrong PINs block the card.
 *
 * ## The screen mirrors the paper
 *
 * Label above, code, community name below. Same order, same three things, and nothing
 * else -- no name, no picture, no Gradido address, exactly as `utils/thankYouCard` draws
 * it. Someone who has held the printed card recognises this without being told.
 *
 * ## The way in stays open when there is nothing to show
 *
 * The symbol in the menu does not disappear when no card is set up. A symbol that is
 * sometimes there and sometimes not is harder to learn than one that always stands in the
 * same place -- and the moment somebody reaches for it is exactly the moment they want to
 * know how to get one.
 */
import { computed, ref } from 'vue'
import { BButton } from 'bootstrap-vue-next'
import { useQuery } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import OwnCodeView from '@/components/QrCode/OwnCodeView'
import { thankYouCards, thankYouCardSettings } from '@/graphql/thankYouCard.graphql'
import CONFIG from '@/config'

const store = useStore()

const settings = ref(null)
const cards = ref([])
// Both answers in, whichever order they arrive in. Without this the page would show
// "not set up yet" for the moment before the server has said anything -- a wrong answer,
// briefly, to somebody standing at a counter.
const settingsAnswered = ref(false)
const cardsAnswered = ref(false)
const answered = computed(() => settingsAnswered.value && cardsAnswered.value)

/**
 * ⛔ A question that went unanswered is not the answer "no".
 *
 * Either query can fail, and if one does, the state it was going to report never arrives.
 * Without this the page falls through to "not set up yet" -- a sentence that is not merely
 * unhelpful but WRONG, and wrong in the direction that sends somebody to the settings to
 * fix a card that is already there. One flag for both, because either failure alone is
 * enough: without the list there is no code to show, and without the settings there is no
 * telling which of the two empty states is true.
 */
const failed = ref(false)

/**
 * ⚠️ `network-only`, as in the settings panel. Neither query takes a variable, so Apollo
 * keeps one cache entry for all of them -- fine while it is refetched, and the reason not
 * to serve this page out of the cache.
 */
const {
  onResult: onSettings,
  onError: onSettingsError,
  refetch: refetchSettings,
} = useQuery(thankYouCardSettings, {}, { fetchPolicy: 'network-only' })
onSettings(({ data }) => {
  settings.value = data?.thankYouCardSettings ?? null
  settingsAnswered.value = true
})
onSettingsError(() => {
  failed.value = true
})

const {
  onResult: onCards,
  onError: onCardsError,
  refetch: refetchCards,
} = useQuery(thankYouCards, {}, { fetchPolicy: 'network-only' })
onCards(({ data }) => {
  cards.value = data?.thankYouCards ?? []
  cardsAnswered.value = true
})
onCardsError(() => {
  failed.value = true
})

/**
 * Asking again, rather than sending somebody out of the page and back in. The two flags go
 * down with it so that a second failure is reported as one, and a slow answer does not
 * flash the empty state on the way.
 *
 * The rejection is swallowed on purpose -- `onError` above already carries the state, and
 * an unhandled rejection here would say the same thing a second time, in the console.
 */
const retry = () => {
  failed.value = false
  settingsAnswered.value = false
  cardsAnswered.value = false
  Promise.all([refetchSettings(), refetchCards()]).catch(() => {})
}

// One member, one card that pays -- the server refuses to unblock a second one while this
// one lives, so there is nothing to choose between.
const activeCard = computed(() => cards.value.find((card) => !card.blockedAt) ?? null)

const link = computed(() =>
  activeCard.value ? `${window.location.origin}/dk/${activeCard.value.code}` : '',
)

const community = computed(() => CONFIG.COMMUNITY_NAME ?? store.state.community?.name ?? '')
</script>
