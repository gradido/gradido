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
      <div class="small text-muted mt-3">{{ $t('my-codes.thank-you-card.hint') }}</div>
    </template>

    <!-- Nothing to show yet. Two different reasons, and they need different sentences:
         the card function is off, or it is on and no card has been made. Both end at the
         same place, so both get the same way there. -->
    <div v-else-if="answered" data-test="my-thank-you-card-none">
      <p v-if="settings" class="mt-3">{{ $t('my-codes.thank-you-card.no-card') }}</p>
      <p v-else class="mt-3">{{ $t('my-codes.thank-you-card.not-set-up') }}</p>
      <BButton variant="gradido" to="/settings" data-test="my-thank-you-card-settings">
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
 * ⚠️ `network-only`, as in the settings panel. Neither query takes a variable, so Apollo
 * keeps one cache entry for all of them -- fine while it is refetched, and the reason not
 * to serve this page out of the cache.
 */
const { onResult: onSettings } = useQuery(thankYouCardSettings, {}, { fetchPolicy: 'network-only' })
onSettings(({ data }) => {
  settings.value = data?.thankYouCardSettings ?? null
  settingsAnswered.value = true
})

const { onResult: onCards } = useQuery(thankYouCards, {}, { fetchPolicy: 'network-only' })
onCards(({ data }) => {
  cards.value = data?.thankYouCards ?? []
  cardsAnswered.value = true
})

// One member, one card that pays -- the server refuses to unblock a second one while this
// one lives, so there is nothing to choose between.
const activeCard = computed(() => cards.value.find((card) => !card.blockedAt) ?? null)

const link = computed(() =>
  activeCard.value ? `${window.location.origin}/dk/${activeCard.value.code}` : '',
)

const community = computed(() => CONFIG.COMMUNITY_NAME ?? store.state.community?.name ?? '')
</script>
