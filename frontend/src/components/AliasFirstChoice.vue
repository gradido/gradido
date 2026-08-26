<!-- AI-GENERATED — not an architecture reference -->
<template>
  <BModal
    id="modal-alias-first-choice"
    v-model="visible"
    centered
    hide-header
    data-test="alias-first-choice"
  >
    <div v-if="!choosing" class="text-center px-2 pt-3">
      <p class="h5 mb-3">{{ $t('settings.username.first-title') }}</p>
      <p class="mb-0">{{ $t('settings.username.first-intro') }}</p>
      <div class="my-3">
        <div class="alias-proposal" data-test="alias-proposal">{{ currentAlias }}</div>
        <div class="alias-address">
          {{ addressPrefix }}
          <b>{{ currentAlias }}</b>
        </div>
      </div>
      <p class="small text-muted mb-0">{{ $t('settings.username.first-hint') }}</p>
    </div>

    <div v-else class="px-2 pt-3">
      <p class="h5 mb-3 text-center">{{ $t('settings.username.first-choose-title') }}</p>
      <label class="form-label" for="alias-first-input">{{ $t('form.username') }}</label>
      <BFormInput
        id="alias-first-input"
        v-model="typed"
        :state="fieldState"
        data-test="alias-first-input"
      />
      <!-- One line that is always there. The three states used to be three v-ifs that
           could all be false at once -- between two keystrokes, while the answer was on
           its way -- so the line vanished and everything below it jumped up and back.
           Reserving the row costs nothing and the field stops twitching while typing. -->
      <div class="alias-first-status small mt-2">
        <span
          v-if="checkEnabled && !formatValid"
          class="text-danger"
          data-test="alias-first-invalid"
        >
          {{ $t('settings.username.first-invalid') }}
        </span>
        <span v-else-if="available === false" class="text-danger" data-test="alias-first-taken">
          {{ $t('settings.username.first-taken') }}
        </span>
        <span v-else-if="available" class="text-success" data-test="alias-first-free">
          {{ $t('settings.username.first-free') }}
        </span>
        <span v-else-if="checkEnabled" class="text-muted" data-test="alias-first-checking">
          {{ $t('settings.username.first-checking') }}
        </span>
      </div>
      <div class="alias-address mt-3">
        {{ addressPrefix }}
        <b>{{ typed }}</b>
      </div>
      <div class="small text-muted mt-1">{{ $t('settings.username.first-rules') }}</div>
    </div>

    <template #footer>
      <template v-if="!choosing">
        <BButton variant="secondary" data-test="alias-first-other" @click="startChoosing">
          {{ $t('settings.username.first-other') }}
        </BButton>
        <BButton variant="gradido" data-test="alias-first-keep" @click="keepIt">
          {{ $t('settings.username.first-keep') }}
        </BButton>
      </template>
      <template v-else>
        <BButton variant="secondary" data-test="alias-first-back" @click="choosing = false">
          {{ $t('settings.username.first-back') }}
        </BButton>
        <BButton
          variant="gradido"
          :disabled="!available || !formatValid || typed === currentAlias"
          data-test="alias-first-save"
          @click="saveChosen"
        >
          {{ $t('form.save') }}
        </BButton>
      </template>
    </template>
  </BModal>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BModal, BButton, BFormInput } from 'bootstrap-vue-next'
import { adoptAlias, updateUserInfos } from '@/graphql/mutations'
import { aliasStatus } from '@/graphql/user.graphql'
import { checkUsername } from '@/graphql/queries'
import { USERNAME_REGEX } from '@/validationSchemas'
import { useAppToast } from '@/composables/useToast'
import CONFIG from '@/config'

/**
 * Shown once, after the first login, for a member still holding the name the system
 * built for them. Two ways out and both end it: keeping the name is how they take it,
 * and picking another does the same with a different word. Closing the window without
 * either leaves the question open, so it comes back next time - which is the point,
 * because a window with no way out would be an imposition at exactly the wrong moment.
 */
const store = useStore()
const { t } = useI18n()
const { toastError } = useAppToast()

// `cache-and-network`, because this query takes no variables and therefore lives under
// a single cache key for everybody. The cache is emptied on logout now, which is the
// real fix; this is the second lock, for every way a member can change without that
// action running - and it keeps the quota honest when it was spent in another tab.
const { result, refetch } = useQuery(aliasStatus, null, { fetchPolicy: 'cache-and-network' })
const { mutate: adopt } = useMutation(adoptAlias)
const { mutate: updateUser } = useMutation(updateUserInfos)

const dismissed = ref(false)
const choosing = ref(false)
const typed = ref('')

const currentAlias = computed(() => store.state.username || '')
// The address is what the name is for, so it is shown rather than explained - and in
// the form it takes on paper, without the scheme.
const addressPrefix = computed(() => {
  try {
    return `${new URL(CONFIG.COMMUNITY_URL).host}/u/`
  } catch {
    return '/u/'
  }
})

const visible = computed({
  get: () =>
    !dismissed.value && !!currentAlias.value && result.value?.aliasStatus?.aliasSettled === false,
  set: (open) => {
    if (!open) {
      dismissed.value = true
    }
  },
})

// Prefilled when the field is opened, not by watching the window: the window is
// already open on the first render, so a watcher would never fire and the member
// would find an empty field.
const startChoosing = () => {
  typed.value = currentAlias.value
  probed.value = currentAlias.value
  choosing.value = true
}

// Asked while typing, with the same query the settings page uses. Reactive variables
// rather than a lazy query on purpose: `load()` answers only the first time it is
// called and returns a bare false after that, which would read as "taken" for every
// name after the first.
const checkEnabled = computed(() => !!typed.value && typed.value !== currentAlias.value)

// Debounced, the way the contribution lists do it: without this a query went out on
// every single keystroke, and each one flipped the answer to "not known yet" and back.
// `probed` is what the query reads; `typed` is what the member sees.
const probed = ref('')
let probeTimer = null
watch(typed, (value) => {
  clearTimeout(probeTimer)
  probeTimer = setTimeout(() => {
    probed.value = value
  }, 300)
})
onBeforeUnmount(() => clearTimeout(probeTimer))

// Checked here as well as on the server, to say WHY: without it somebody who types two
// letters is told the name is taken, which is untrue and unhelpful in the very first
// window they ever see. It also holds the button and keeps the query below from asking
// about a word that cannot be free -- and it must be declared BEFORE that query, whose
// options getter runs during setup.
const formatValid = computed(() => USERNAME_REGEX.test(typed.value))

const { result: checkResult, loading: checking } = useQuery(
  checkUsername,
  () => ({ username: probed.value }),
  // `formatValid` too: "ab" can never be free, so asking about it is a round trip whose
  // answer is discarded either way -- the invalid branch below wins in the template, in
  // `fieldState` and on the Save button. Nothing reads a stale answer through this gap.
  () => ({
    enabled: checkEnabled.value && formatValid.value && probed.value === typed.value,
    fetchPolicy: 'no-cache',
  }),
)
// `null` while the answer is on its way, because the previous one is still lying in
// `checkResult` and it belongs to a different word. Without this, typing a free name
// and then a taken one leaves the old `true` on screen for the length of a round trip -
// long enough to click Save and get a bare error code back.
const available = computed(() => {
  if (!checkEnabled.value || checking.value || probed.value !== typed.value) {
    return null
  }
  return checkResult.value?.checkUsername ?? null
})
const fieldState = computed(() => {
  if (!checkEnabled.value) {
    return null
  }
  return formatValid.value ? available.value : false
})

const keepIt = async () => {
  try {
    await adopt()
    dismissed.value = true
    await refetch()
  } catch (error) {
    toastError(error.message)
  }
}

const saveChosen = async () => {
  try {
    await updateUser({ alias: typed.value })
    store.commit('username', typed.value)
    dismissed.value = true
    await refetch()
  } catch (error) {
    toastError(error.message)
  }
}
</script>

<style scoped>
.alias-proposal {
  font-size: 1.7rem;
  font-weight: 600;
  color: var(--gold, #c58d38);
  word-break: break-all;
}

.alias-address {
  font-size: 0.84rem;
  color: var(--text-muted);
  word-break: break-all;
}

/* The status line keeps its row even when it has nothing to say. Without the reserved
   height the address and the rules below it moved up and down while typing. */
.alias-first-status {
  min-height: 1.25rem;
}
</style>
