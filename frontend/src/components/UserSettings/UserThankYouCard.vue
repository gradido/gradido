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
          <BButton
            variant="gradido"
            :disabled="busy"
            data-test="thank-you-card-sheet"
            @click="printSheet"
          >
            {{ $t('thank-you-card.settings.sheet') }}
          </BButton>
          <!-- ⛔ The download button that used to stand here is gone, on purpose. A
               thank-you card is not given away like a business card: it is ONE card, for one
               person, printed at home. The sheet does that at the right size; a bare PNG of
               unstated size only invited printing it wrong. (Bernd, 21.08.2026) -->
          <BButton
            class="ms-2"
            variant="danger"
            :disabled="busy"
            data-test="thank-you-card-block"
            @click="pendingBlockId = activeCard.id"
          >
            {{ $t('thank-you-card.settings.block') }}
          </BButton>
        </div>
        <div class="small text-muted mt-2">{{ $t('thank-you-card.settings.sheet-hint') }}</div>
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
        <div
          v-for="card in blockedCards"
          :key="card.id"
          class="d-flex justify-content-between align-items-center"
        >
          <span class="small">{{ card.label }}</span>
          <span class="d-flex align-items-center gap-2">
            <span class="small text-muted">
              {{ $t('thank-you-card.settings.blocked-on', { date: $d(new Date(card.blockedAt)) }) }}
            </span>
            <BButton
              size="sm"
              variant="secondary"
              :disabled="busy || Boolean(activeCard)"
              :data-test="`thank-you-card-unblock-${card.id}`"
              @click="unblockById(card.id)"
            >
              {{ $t('thank-you-card.settings.unblock') }}
            </BButton>
          </span>
        </div>
        <!-- A disabled button with no reason next to it is a dead end. The reason is the
             invariant itself: one member, one card that pays. -->
        <div v-if="activeCard" class="small text-muted mt-1">
          {{ $t('thank-you-card.settings.unblock-needs-no-active') }}
        </div>
      </div>
    </div>

    <!--
      Both ways in ask, and both ask about a NAMED card: the button means the one that works,
      the receipt link names the one that was paid with -- which may since have been replaced.
      That is why the dialogue holds an id rather than a flag.

      ⚠️ Its own footer, not `ok-only`. A dialogue that opens because somebody followed a link
      needs a way of saying no, and `ok-only` renders an OK and nothing else. The buttons also
      say what they do: an "Ok" under a question is only half an answer.
    -->
    <AppModal
      :model-value="pendingBlockId !== null"
      :title="$t('thank-you-card.settings.block-confirm-title')"
      @update:model-value="pendingBlockId = null"
    >
      <p v-if="pendingBlockLabel" class="fw-bold mb-2" data-test="thank-you-card-block-card">
        {{ $t('thank-you-card.settings.block-confirm-card', { label: pendingBlockLabel }) }}
      </p>
      <p class="mb-0" data-test="thank-you-card-block-confirm">
        {{ $t('thank-you-card.settings.block-confirm') }}
      </p>
      <template #footer>
        <BButton data-test="thank-you-card-block-cancel" @click="pendingBlockId = null">
          {{ $t('form.cancel') }}
        </BButton>
        <BButton
          variant="danger"
          :disabled="busy"
          data-test="thank-you-card-block-ok"
          @click="confirmBlock"
        >
          {{ $t('thank-you-card.settings.block') }}
        </BButton>
      </template>
    </AppModal>

    <!--
      ⛔ `no-footer`, NOT `hide-footer`. bootstrap-vue-next renamed the prop; the old name is
      accepted silently as a plain attribute and does nothing, so the dialog kept its default
      footer and the panel showed TWO sets of buttons -- a save button of its own plus an
      untranslated OK/Cancel pair underneath. Nothing warns about this.

      The footer is the answer rather than something to hide: a dialog's actions belong in
      it, and it brings the Cancel this dialog never had -- until now the only way out was
      the little x in the corner.

      ⚠️ `@ok.prevent`, because the dialog must NOT close itself: `savePin` closes it only
      after the server has taken the PIN. A rejected PIN has to leave the dialog standing,
      or the message lands on a screen that no longer shows the field it is about.

      ⚠️ `busy`, not `ok-disabled`: the library computes both buttons from it
      (`disableCancel = cancelDisabled || busy`, `disableOk = okDisabled || busy`), so a save
      in flight takes Cancel out of reach too. Read in the shipped bundle, not assumed.

      ⛔ And deliberately NOT `no-close-on-backdrop` / `no-close-on-esc` / `no-header-close`,
      although a reviewer asked for them. Dismissing mid-save costs nothing: the mutation is
      already sent, `run` still refetches and reports, and `@hide` clears the field -- the
      worst case is a success message arriving after the box is gone. Sealing all three would
      buy that back at the price of a request that hangs leaving somebody locked in a dialog
      with both buttons dead and no way out at all, because `run` has no timeout. The x stays.
    -->
    <BModal
      v-model="showSetup"
      :title="$t('thank-you-card.settings.pin-title')"
      :ok-title="$t('form.save')"
      ok-variant="gradido"
      :cancel-title="$t('form.cancel')"
      :busy="busy"
      @ok.prevent="savePin"
      @hide="newPin = ''"
    >
      <!--
        The rules carry an id so the field can point at them: a screen reader then reads
        what the PIN may be WITH the field, rather than leaving it behind as a paragraph
        somebody has to have heard on the way past.
      -->
      <p id="thank-you-card-pin-rules" class="small">
        {{ $t('thank-you-card.settings.pin-rules') }}
      </p>
      <!--
        ⚠️ Hidden by default and readable on request, which is the opposite trade to a
        password field. A PIN is set at home, typed once, and there is no "forgot it" —
        getting it wrong here means a card that cannot pay and nobody knowing why. So the
        eye is not a convenience: it is the only chance to check what was typed. It stays
        hidden by default all the same, because "at home" is also a kitchen table with
        somebody sitting across it.
      -->
      <BInputGroup>
        <BFormInput
          id="thank-you-card-new-pin"
          v-model="newPin"
          :type="pinInputType(showPin)"
          :class="{ [PIN_MASK_CLASS]: !showPin }"
          autocomplete="off"
          inputmode="numeric"
          maxlength="6"
          :aria-label="$t('thank-you-card.settings.pin-title')"
          aria-describedby="thank-you-card-pin-rules"
          data-test="thank-you-card-new-pin"
        />
        <template #append>
          <BButton
            variant="outline-light"
            class="border-start-0 rounded-end"
            tabindex="-1"
            :aria-label="
              showPin
                ? $t('thank-you-card.settings.pin-hide')
                : $t('thank-you-card.settings.pin-show')
            "
            data-test="thank-you-card-pin-eye"
            @click="showPin = !showPin"
          >
            <IBiEye v-if="showPin" class="eye-icon" />
            <IBiEyeSlash v-else class="eye-icon" />
          </BButton>
        </template>
      </BInputGroup>
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
import { BButton, BFormInput, BInputGroup, BModal } from 'bootstrap-vue-next'
import AppModal from '@/components/AppModal'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import {
  blockThankYouCard,
  createThankYouCard,
  deleteThankYouCardSettings,
  setThankYouCardLimits,
  setThankYouCardSettings,
  thankYouCards,
  thankYouCardSettings,
  unblockThankYouCard,
} from '@/graphql/thankYouCard.graphql'
import { useAppToast } from '@/composables/useToast'
import { printThankYouCardSheet } from '@/utils/thankYouCard'
import { PIN_MASK_CLASS, pinInputType } from '@/utils/pinMasking'
import CONFIG from '@/config'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useStore()
const { toastError, toastSuccess } = useAppToast()

const settings = ref(null)
const cards = ref([])
const showSetup = ref(false)
// null while nothing is being asked. It holds an ID rather than a flag because the two ways
// in name different cards, and because the answer must land on the card the question named:
// reading `activeCard` again at confirm time would block whatever is active by then, which
// after a reload in the meantime need not be the same card.
const pendingBlockId = ref(null)
const showPin = ref(false)
const newPin = ref('')
const newLabel = ref('')
const maxPerPayment = ref('')
const maxPerDay = ref('')
const busy = ref(false)

const activeCard = computed(() => cards.value.find((card) => !card.blockedAt) ?? null)
const blockedCards = computed(() => cards.value.filter((card) => card.blockedAt))
// Empty until the list arrives, which at mount it has not: the receipt's link opens the
// question before the query answers, so the name appears a moment later. Better late than
// asked about a card the reader cannot identify.
const pendingBlockLabel = computed(
  () => cards.value.find((card) => card.id === pendingBlockId.value)?.label ?? '',
)

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
const { mutate: unblockCard } = useMutation(unblockThankYouCard)

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
 *
 * ⛔ It opens the question, it does not block. The link may be months old, it may be opened
 * from a history entry or forwarded by somebody else, and blocking a card is the one action
 * here that reaches out of this page -- the card in a wallet stops working. So the wish out
 * of the address goes through the same dialogue the button does, naming the card, with a way
 * of saying no.
 *
 * ⚠️ That costs the emergency path one click, and the click is the point: whoever did NOT
 * mean it gets to stop, and whoever did mean it sees which card they are killing. The undo
 * on this page stays the second net, not the first.
 *
 * (What the question does not have to guard against is a machine following the link. The
 * mutation needs the Vue app booted, the store restored and a Bearer token out of it, so a
 * mail client or link scanner fetching the URL gets `index.html` and nothing happens; the
 * token is a header, not a cookie, so there is no cross-site request to forge either.)
 */
onMounted(() => {
  const wanted = Number(route.query.block)
  if (Number.isFinite(wanted) && wanted > 0) {
    pendingBlockId.value = wanted
    // ⛔ And the wish is taken out of the address, at once. It is an INSTRUCTION, not a
    // description of the page, so it must not survive being acted on: left standing, it
    // fires again on every reload and every visit through the history — and once the card
    // has been deliberately unblocked, a reload would silently block it a second time,
    // with nothing on the screen connecting the two. The reload right after blocking is
    // the harmless half: it answers with "already blocked" for something that just worked.
    router.replace({ query: {} })
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

/**
 * ⛔ Reachable again, which it was not: blocking took one click and the card then vanished
 * into a list with nothing to press. The backend has always had the mutation.
 *
 * ⚠️ Refused by the server while another card of theirs works — one member, one card that
 * pays, and the daily limit is counted per card. The button says so by being unavailable and
 * by the line under the list, rather than by letting somebody press it into an error.
 */
const unblockById = (cardId) =>
  run(() => unblockCard({ cardId }), t('thank-you-card.settings.unblocked'))

const confirmBlock = () => {
  const wanted = pendingBlockId.value
  pendingBlockId.value = null
  // Belt and braces: the dialogue cannot be open without an id, so this only fires if
  // something else has cleared it in between.
  if (wanted === null) {
    return
  }
  // The id the question named, not `activeCard` read again here. The list reloads after
  // every action and the receipt's own link can arrive while this stands open, so the two
  // need not still be the same card -- and answering "yes" to one question must not block
  // a different card. If it has been blocked in the meantime the server says so, which is
  // an honest answer; silently doing nothing after somebody pressed the red button is not.
  blockById(wanted)
}

/**
 * One way out, and it is the one that states the SIZE: an A4 page the browser prints at
 * exactly 54 x 85.6 mm, with a cut line. There used to be a second, a bare PNG whose
 * physical size nothing states — right for a business card somebody takes to a print shop,
 * wrong here, because a thank-you card is one card for one person, printed at home.
 */
const cardOptions = () => ({
  url: `${window.location.origin}/dk/${activeCard.value.code}`,
  label: activeCard.value.label,
  community: CONFIG.COMMUNITY_NAME ?? store.state.community?.name ?? '',
  title: t('thank-you-card.name'),
})

const printSheet = async () => {
  if (!activeCard.value) {
    return
  }
  busy.value = true
  try {
    await printThankYouCardSheet(cardOptions())
  } catch (error) {
    toastError(error.message)
  } finally {
    busy.value = false
  }
}
</script>
