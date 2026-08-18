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
      <div
        v-if="checkEnabled && !formatValid"
        class="small text-danger mt-2"
        data-test="alias-first-invalid"
      >
        {{ $t('settings.username.first-invalid') }}
      </div>
      <div
        v-else-if="available === false"
        class="small text-danger mt-2"
        data-test="alias-first-taken"
      >
        {{ $t('settings.username.first-taken') }}
      </div>
      <div v-else-if="available" class="small text-success mt-2" data-test="alias-first-free">
        {{ $t('settings.username.first-free') }}
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
import { computed, ref } from 'vue'
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

const { result, refetch } = useQuery(aliasStatus)
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
  choosing.value = true
}

// Asked while typing, with the same query the settings page uses. Reactive variables
// rather than a lazy query on purpose: `load()` answers only the first time it is
// called and returns a bare false after that, which would read as "taken" for every
// name after the first.
const checkEnabled = computed(() => !!typed.value && typed.value !== currentAlias.value)
const { result: checkResult, loading: checking } = useQuery(
  checkUsername,
  () => ({ username: typed.value }),
  () => ({ enabled: checkEnabled.value, fetchPolicy: 'no-cache' }),
)
// `null` while the answer is on its way, because the previous one is still lying in
// `checkResult` and it belongs to a different word. Without this, typing a free name
// and then a taken one leaves the old `true` on screen for the length of a round trip -
// long enough to click Save and get a bare error code back.
const available = computed(() => {
  if (!checkEnabled.value || checking.value) {
    return null
  }
  return checkResult.value?.checkUsername ?? null
})
// Checked here as well as on the server, to say WHY: without it somebody who types two
// letters is told the name is taken, which is untrue and unhelpful in the very first
// window they ever see. It also holds the button, but it is not what makes the stale
// answer harmless - only a valid word ever reaches the server, so the guard against a
// leftover `true` has to sit on `available` itself, above.
const formatValid = computed(() => USERNAME_REGEX.test(typed.value))
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
</style>
