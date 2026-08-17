<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="user-thank-you-card">
    <div class="fw-bold mb-1">{{ $t('thank-you-card.settings.title') }}</div>

    <!-- Off, and this is the one moment anybody reads the rules. A feature that were on from
         the start would have no such moment, and the sentence about the PIN travelling over
         somebody else's screen would then sit where nobody looks. -->
    <div v-if="!settings" data-test="thank-you-card-off">
      <div class="small text-muted mb-2">{{ $t('thank-you-card.settings.not-set-up') }}</div>
      <p class="small">{{ $t('thank-you-card.settings.explain') }}</p>
      <p class="small text-muted">{{ $t('thank-you-card.settings.explain-pin') }}</p>
      <BButton variant="gradido" data-test="thank-you-card-enable" @click="showSetup = true">
        {{ $t('thank-you-card.settings.enable') }}
      </BButton>
    </div>

    <div v-else data-test="thank-you-card-on">
      <div class="small text-muted mb-3">{{ $t('thank-you-card.settings.on') }}</div>

      <label class="small" for="tyc-max-payment">
        {{ $t('thank-you-card.settings.max-per-payment') }}
      </label>
      <BFormInput id="tyc-max-payment" v-model="maxPerPayment" type="text" inputmode="decimal" />

      <label class="small mt-2" for="tyc-max-day">
        {{ $t('thank-you-card.settings.max-per-day') }}
      </label>
      <BFormInput id="tyc-max-day" v-model="maxPerDay" type="text" inputmode="decimal" />

      <div class="mt-3">
        <BButton variant="gradido" :disabled="busy" @click="saveLimits">
          {{ $t('form.save') }}
        </BButton>
        <BButton class="ms-2" variant="secondary" @click="showSetup = true">
          {{ $t('thank-you-card.settings.change-pin') }}
        </BButton>
        <BButton class="ms-2" variant="danger" :disabled="busy" @click="switchOff">
          {{ $t('thank-you-card.settings.disable') }}
        </BButton>
      </div>

      <hr />

      <div class="fw-bold mb-2">{{ $t('thank-you-card.settings.your-card') }}</div>

      <div v-if="activeCard" data-test="thank-you-card-active">
        <label class="small" for="tyc-label">{{ $t('thank-you-card.settings.label') }}</label>
        <BFormInput id="tyc-label" :model-value="activeCard.label" disabled />
        <div class="mt-3">
          <BButton variant="gradido" :disabled="busy" @click="download">
            {{ $t('thank-you-card.settings.print') }}
          </BButton>
          <BButton class="ms-2" variant="danger" :disabled="busy" @click="block">
            {{ $t('thank-you-card.settings.block') }}
          </BButton>
        </div>
      </div>

      <div v-else>
        <label class="small" for="tyc-new-label">{{ $t('thank-you-card.settings.label') }}</label>
        <BFormInput
          id="tyc-new-label"
          v-model="newLabel"
          type="text"
          :placeholder="$t('thank-you-card.settings.label-placeholder')"
        />
        <BButton
          class="mt-3"
          variant="gradido"
          :disabled="!newLabel || busy"
          data-test="thank-you-card-create"
          @click="create"
        >
          {{ $t('thank-you-card.settings.create') }}
        </BButton>
      </div>

      <!-- Blocked cards are kept and listed. A card in somebody's drawer stays a card that
           can say what happened to it, instead of turning into an unknown code. -->
      <div v-if="blockedCards.length" class="mt-4">
        <div class="small text-muted text-uppercase">
          {{ $t('thank-you-card.settings.earlier-cards') }}
        </div>
        <div v-for="card in blockedCards" :key="card.id" class="d-flex justify-content-between">
          <span class="small">{{ card.label }}</span>
          <span class="small text-muted">
            {{ $t('thank-you-card.settings.blocked-on', { date: $d(new Date(card.blockedAt)) }) }}
          </span>
        </div>
      </div>
    </div>

    <BModal v-model="showSetup" :title="$t('thank-you-card.settings.pin-title')" hide-footer>
      <!--
        The rules carry an id so the field can point at them: a screen reader then reads
        what the PIN may be WITH the field, rather than leaving it behind as a paragraph
        somebody has to have heard on the way past.
      -->
      <p id="thank-you-card-pin-rules" class="small">
        {{ $t('thank-you-card.settings.pin-rules') }}
      </p>
      <BFormInput
        id="thank-you-card-new-pin"
        v-model="newPin"
        type="password"
        inputmode="numeric"
        maxlength="6"
        :aria-label="$t('thank-you-card.settings.pin-title')"
        aria-describedby="thank-you-card-pin-rules"
        data-test="thank-you-card-new-pin"
      />
      <BButton class="mt-3" variant="gradido" :disabled="busy" @click="savePin">
        {{ $t('form.save') }}
      </BButton>
    </BModal>
  </div>
</template>

<script setup>
/**
 * "Mit Karte danken" in the settings.
 *
 * ## One role, not two
 *
 * Everything here belongs to somebody who PAYS with a card: their PIN, their limits, their
 * card. What the other side of the counter needs -- the reference a till puts on payments --
 * is not here, because it is learned where it is used. That is not tidiness: most people are
 * only ever one of the two roles, and a field for taking payments sitting among a private
 * person's own limits suggests everybody needs one.
 *
 * ## The switch is the PIN
 *
 * There is no on/off control. Enabling means setting a PIN and disabling means deleting it,
 * so the state "on but without a PIN" cannot be reached, not even by a half-finished form.
 */
import { BButton, BFormInput, BModal } from 'bootstrap-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import {
  blockThankYouCard,
  createThankYouCard,
  deleteThankYouCardSettings,
  setThankYouCardLimits,
  setThankYouCardSettings,
  thankYouCards,
  thankYouCardSettings,
} from '@/graphql/thankYouCard.graphql'
import { useAppToast } from '@/composables/useToast'
import { drawThankYouCard, thankYouCardFileName } from '@/utils/thankYouCard'
import CONFIG from '@/config'

const { t } = useI18n()
const route = useRoute()
const store = useStore()
const { toastError, toastSuccess } = useAppToast()

const settings = ref(null)
const cards = ref([])
const showSetup = ref(false)
const newPin = ref('')
const newLabel = ref('')
const maxPerPayment = ref('')
const maxPerDay = ref('')
const busy = ref(false)

const activeCard = computed(() => cards.value.find((card) => !card.blockedAt) ?? null)
const blockedCards = computed(() => cards.value.filter((card) => card.blockedAt))

const { refetch: refetchSettings, onResult: onSettings } = useQuery(
  thankYouCardSettings,
  {},
  { fetchPolicy: 'network-only' },
)
onSettings(({ data }) => {
  settings.value = data?.thankYouCardSettings ?? null
  if (settings.value) {
    maxPerPayment.value = String(settings.value.maxPerPayment)
    maxPerDay.value = String(settings.value.maxPerDay)
  }
})

const { refetch: refetchCards, onResult: onCards } = useQuery(
  thankYouCards,
  {},
  { fetchPolicy: 'network-only' },
)
onCards(({ data }) => {
  cards.value = data?.thankYouCards ?? []
})

const { mutate: saveSettings } = useMutation(setThankYouCardSettings)
const { mutate: saveLimitsMutation } = useMutation(setThankYouCardLimits)
const { mutate: disable } = useMutation(deleteThankYouCardSettings)
const { mutate: addCard } = useMutation(createThankYouCard)
const { mutate: blockCard } = useMutation(blockThankYouCard)

const asNumber = (value) => Number(String(value).replace(',', '.'))

/**
 * ⛔ A GradidoUnit travels as a STRING, never as a number.
 *
 * `GradidoUnitScalar.parseValue` throws for anything that is not a string, so a number does
 * not reach the resolver at all — the request dies during variable coercion and comes back
 * as a bare **HTTP 400** with no GraphQL error in it to read. The rest of the wallet has
 * always done it this way (`Send.vue` sends `amount.toString()`); this component did not,
 * and no test could see it because a mocked Apollo accepts whatever it is handed.
 */
const asAmount = (value) => asNumber(value).toString()

/**
 * The receipt links here with `?block=<id>`. The link only navigates -- the login is the
 * authorisation, and the router guard has already required it by the time this runs. That
 * is why no public "block" door had to be opened for a mail button.
 */
onMounted(() => {
  const wanted = Number(route.query.block)
  if (Number.isFinite(wanted) && wanted > 0) {
    blockById(wanted)
  }
})

const run = async (action, success) => {
  busy.value = true
  try {
    await action()
    await Promise.all([refetchSettings(), refetchCards()])
    if (success) {
      toastSuccess(success)
    }
  } catch (error) {
    toastError(error.message)
  } finally {
    busy.value = false
  }
}

const savePin = () =>
  run(async () => {
    await saveSettings({
      pin: newPin.value,
      maxPerPayment: (asNumber(maxPerPayment.value) || 50).toString(),
      maxPerDay: (asNumber(maxPerDay.value) || 100).toString(),
    })
    newPin.value = ''
    showSetup.value = false
  }, t('thank-you-card.settings.saved'))

const saveLimits = () =>
  run(
    () =>
      saveLimitsMutation({
        maxPerPayment: asAmount(maxPerPayment.value),
        maxPerDay: asAmount(maxPerDay.value),
      }),
    t('thank-you-card.settings.saved'),
  )

const switchOff = () => run(() => disable(), t('thank-you-card.settings.disabled'))

const create = () =>
  run(async () => {
    await addCard({ label: newLabel.value })
    newLabel.value = ''
  }, t('thank-you-card.settings.created'))

const blockById = (cardId) => run(() => blockCard({ cardId }), t('thank-you-card.settings.blocked'))

const block = () => blockById(activeCard.value.id)

const download = async () => {
  if (!activeCard.value) {
    return
  }
  busy.value = true
  try {
    const dataUrl = await drawThankYouCard({
      url: `${window.location.origin}/dk/${activeCard.value.code}`,
      label: activeCard.value.label,
      community: CONFIG.COMMUNITY_NAME ?? store.state.community?.name ?? '',
      title: t('thank-you-card.name'),
    })
    const anchor = document.createElement('a')
    anchor.href = dataUrl
    anchor.download = thankYouCardFileName(activeCard.value.label)
    anchor.click()
  } catch (error) {
    toastError(error.message)
  } finally {
    busy.value = false
  }
}
</script>
