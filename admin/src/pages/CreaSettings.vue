<template>
  <div class="crea-settings">
    <div class="h2 mb-3">{{ $t('crea.settings.title') }}</div>
    <div v-if="isAdmin" class="crea-settings-form">
      <div class="h4 mt-4 mb-1">{{ $t('crea.settings.sectionModeration') }}</div>
      <small class="text-muted d-block mb-3">
        {{ $t('crea.settings.sectionModerationHint') }}
      </small>
      <BFormGroup :label="$t('crea.settings.model')" class="mb-3">
        <BFormInput
          v-model="form.model"
          :placeholder="$t('crea.settings.modelPlaceholder', { model: defaultModel })"
        />
        <BFormSelect
          class="mt-2"
          :model-value="''"
          :options="modelPresetOptions"
          @update:model-value="onPreset"
        />
        <small class="text-muted d-block mt-1">
          {{ $t('crea.settings.modelHint', { model: defaultModel }) }}
        </small>
      </BFormGroup>
      <BFormGroup :label="$t('crea.settings.effort')" class="mb-3">
        <BFormSelect v-model="form.effort" :options="effortOptions" />
        <small class="text-muted d-block mt-1">{{ $t('crea.settings.effortHint') }}</small>
      </BFormGroup>
      <BFormGroup class="mb-3">
        <BFormCheckbox v-model="form.fastMode">
          {{ $t('crea.settings.fastMode') }}
        </BFormCheckbox>
        <small class="text-muted d-block mt-1">{{ $t('crea.settings.fastModeHint') }}</small>
      </BFormGroup>
      <BButton variant="primary" :disabled="saving || !settingsLoaded" @click="save">
        {{ $t('save') }}
      </BButton>
      <BButton
        variant="secondary"
        class="ms-2"
        :disabled="testing || !settingsLoaded"
        @click="test"
      >
        {{ $t('crea.settings.testModel') }}
      </BButton>

      <hr class="my-4" />

      <div class="h4 mb-1">{{ $t('crea.settings.sectionFirstCreation') }}</div>
      <small class="text-muted d-block mb-3">
        {{ $t('crea.settings.sectionFirstCreationHint') }}
      </small>
      <div class="mb-3" data-test="first-creation-signer">
        <template v-if="signer">
          <strong>{{ signerLabel }}</strong>
          <span v-if="!signer.eligible" class="text-danger d-block">
            {{ $t('crea.settings.signerNotEligible', { reason: signerReason(signer.reason) }) }}
          </span>
        </template>
        <span v-else class="text-warning">{{ $t('crea.settings.noSigner') }}</span>
      </div>
      <BFormGroup :label="$t('crea.settings.signerSearch')" class="mb-3">
        <BFormInput
          v-model="signerQuery"
          :placeholder="$t('crea.settings.signerSearchPlaceholder')"
          data-test="signer-query"
        />
        <BFormSelect
          v-if="signerOptions.length"
          v-model="signerChoice"
          class="mt-2"
          :options="signerOptions"
          data-test="signer-choice"
        />
        <small v-else-if="signerSearched" class="text-muted d-block mt-1">
          {{ $t('crea.settings.signerNoMatch') }}
        </small>
      </BFormGroup>
      <BButton
        variant="primary"
        :disabled="savingSigner || !settingsLoaded || !signerChoice"
        data-test="signer-save"
        @click="saveSigner"
      >
        {{ $t('save') }}
      </BButton>
      <BButton
        variant="outline-danger"
        class="ms-2"
        :disabled="savingSigner || !settingsLoaded || !signer"
        data-test="signer-remove"
        @click="clearSigner"
      >
        {{ $t('crea.settings.signerRemove') }}
      </BButton>

      <hr class="my-4" />

      <div class="h4 mb-1">{{ $t('crea.settings.sectionMatching') }}</div>
      <small class="text-muted d-block mb-3">
        {{ $t('crea.settings.sectionMatchingHint') }}
      </small>
      <BFormGroup class="mb-3">
        <BFormCheckbox v-model="form.matchingKeyingActive">
          {{ $t('crea.settings.matchingKeying') }}
        </BFormCheckbox>
        <small class="text-muted d-block mt-1">{{ $t('crea.settings.matchingKeyingHint') }}</small>
      </BFormGroup>
      <BButton variant="primary" :disabled="savingKeying || !settingsLoaded" @click="saveKeying">
        {{ $t('save') }}
      </BButton>

      <small v-if="!settingsLoaded" class="text-muted d-block mt-2">
        {{ $t('crea.settings.unavailable') }}
      </small>
    </div>
    <div v-else>{{ $t('crea.settings.adminOnly') }}</div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import {
  creaSettings as creaSettingsQuery,
  setCreaMatchingKeying,
  setCreaSettings,
  setFirstCreationSigner,
  testCreaModel,
} from '@/graphql/crea.graphql'
import { searchUsers } from '@/graphql/searchUsers.js'

const { t } = useI18n()
const store = useStore()
const { toastSuccess, toastError } = useAppToast()

const isAdmin = computed(() => store.state.moderator.roles.includes('ADMIN'))

// The form holds display defaults until the query answers, never the server's values, and
// setCreaSettings overwrites all FOUR settings at once - the fourth being the one that
// decides whether Crea is paid to key matching entries. So nothing here may be submitted
// before settingsLoaded turns true - otherwise one click clears the configured model and
// drops the effort level for the whole instance, confirmed by a success toast. That is not
// only a race: a query that failed leaves the defaults standing for as long as the page is
// open, because the error watcher below only raises a toast.
const form = ref({ model: '', effort: 'disabled', fastMode: false, matchingKeyingActive: false })
const defaultModel = ref('')
const settingsLoaded = ref(false)
const saving = ref(false)
const savingKeying = ref(false)
const testing = ref(false)

// The first-creation signer (ES-005): shown as stored, picked from the member search. Only
// accounts that could sign are offered - an admin, or a moderator - and the server has the
// last word (a moderator with a group scope is refused there, with a reason).
const signer = ref(null)
const signerQuery = ref('')
const signerChoice = ref(null)
const savingSigner = ref(false)
const SIGNER_ROLES = ['ADMIN', 'MODERATOR', 'MODERATOR_AI']

const modelPresetOptions = computed(() => [
  { value: '', text: t('crea.settings.presetPlaceholder') },
  { value: 'claude-sonnet-5', text: 'claude-sonnet-5' },
  { value: 'claude-opus-5', text: 'claude-opus-5' },
  { value: 'claude-haiku-4-5', text: 'claude-haiku-4-5' },
  { value: 'claude-fable-5', text: 'claude-fable-5' },
  { value: 'claude-opus-4-8', text: 'claude-opus-4-8' },
  { value: 'claude-sonnet-4-6', text: 'claude-sonnet-4-6' },
])

const effortOptions = computed(() => [
  { value: 'disabled', text: t('crea.settings.effortDisabled') },
  { value: 'low', text: t('crea.settings.effortLow') },
  { value: 'medium', text: t('crea.settings.effortMedium') },
  { value: 'high', text: t('crea.settings.effortHigh') },
  { value: 'xhigh', text: t('crea.settings.effortXhigh') },
  { value: 'max', text: t('crea.settings.effortMax') },
])

const { result, error } = useQuery(creaSettingsQuery, null, {
  fetchPolicy: 'network-only',
  enabled: isAdmin,
})

watch(
  result,
  () => {
    const settings = result.value?.creaSettings
    if (settings) {
      form.value = {
        model: settings.model ?? '',
        effort: settings.effort ?? 'disabled',
        fastMode: settings.fastMode ?? false,
        matchingKeyingActive: settings.matchingKeyingActive ?? false,
      }
      defaultModel.value = settings.defaultModel
      signer.value = settings.firstCreationSigner ?? null
      settingsLoaded.value = true
    }
  },
  { immediate: true },
)

const signerLabel = computed(() => {
  if (!signer.value) return ''
  const name = [signer.value.firstName, signer.value.lastName].filter(Boolean).join(' ')
  return t('crea.settings.signerCurrent', {
    name: name || signer.value.alias || `#${signer.value.userId}`,
    role: signer.value.role ?? '-',
  })
})

// The server answers with a code; the sentence is built here, in the admin's language.
// Literal keys per case, so the i18n lint can see every one of them.
function signerReason(code) {
  switch (code) {
    case 'NOT_FOUND':
      return t('crea.settings.signerReason.NOT_FOUND')
    case 'DELETED':
      return t('crea.settings.signerReason.DELETED')
    case 'NOT_MODERATION':
      return t('crea.settings.signerReason.NOT_MODERATION')
    case 'SCOPED':
      return t('crea.settings.signerReason.SCOPED')
    case 'IS_MEMBER':
      return t('crea.settings.signerReason.IS_MEMBER')
    case 'NOT_CONFIGURED':
      return t('crea.settings.signerReason.NOT_CONFIGURED')
    default:
      return code
  }
}

const signerSearchEnabled = computed(() => isAdmin.value && signerQuery.value.trim().length >= 2)
const signerSearched = computed(() => signerSearchEnabled.value)
const { result: signerSearchResult } = useQuery(
  searchUsers,
  () => ({
    query: signerQuery.value.trim(),
    filters: { byActivated: true, byDeleted: false },
    currentPage: 1,
    pageSize: 25,
    order: 'ASC',
  }),
  // Debounced: a request per keystroke would cost the server a full member search each.
  { fetchPolicy: 'network-only', enabled: signerSearchEnabled, debounce: 300 },
)
const signerOptions = computed(() => {
  if (!signerSearchEnabled.value) return []
  const list = signerSearchResult.value?.searchUsers?.userList ?? []
  return list
    .filter((user) => (user.roles ?? []).some((role) => SIGNER_ROLES.includes(role)))
    .map((user) => ({
      value: user.userId,
      text: `${user.firstName} ${user.lastName} · ${(user.roles ?? []).join(', ')}`,
    }))
})

// A choice only stands while it is on the list. Without this, editing the query after a
// pick keeps the old id armed behind a select that shows nothing - and Save sends it.
watch(signerOptions, (options) => {
  if (
    signerChoice.value !== null &&
    !options.some((option) => option.value === signerChoice.value)
  ) {
    signerChoice.value = null
  }
})

watch(error, () => {
  if (error.value) toastError(error.value.message)
})

const { mutate: saveMutation } = useMutation(setCreaSettings)
const { mutate: testMutation } = useMutation(testCreaModel)
const { mutate: saveKeyingMutation } = useMutation(setCreaMatchingKeying)
const { mutate: signerMutation } = useMutation(setFirstCreationSigner)

function apiInput() {
  const model = form.value.model.trim()
  // ⛔ The keying switch is NOT in here. It has its own mutation and its own Save
  // button, so that saving a model cannot carry a stale switch value from a tab that
  // has been open since before somebody else changed it.
  return { model: model || null, effort: form.value.effort, fastMode: form.value.fastMode }
}

// Turns the fast-mode outcome code into a localized note. A rate limit means "busy
// right now", which is something quite different from "this model cannot do it" - so
// the two never share a sentence.
function fastModeNote(testResult) {
  if (testResult.fastMode === 'active') {
    return ` ${t('crea.settings.fastModeActive')}`
  }
  if (testResult.fastMode === 'rate_limited') {
    return ` ${t('crea.settings.fastModeBusy')}`
  }
  if (testResult.fastMode === 'refused') {
    return ` ${t('crea.settings.fastModeRefused', { detail: testResult.fastModeDetail })}`
  }
  return ''
}

function onPreset(value) {
  if (value) form.value.model = value
}

async function save() {
  saving.value = true
  try {
    const { data } = await saveMutation({ input: apiInput() })
    const settings = data.setCreaSettings
    // Only the three this mutation owns. The keying switch keeps whatever the other
    // section holds - this save did not touch it.
    form.value = {
      ...form.value,
      model: settings.model ?? '',
      effort: settings.effort,
      fastMode: settings.fastMode ?? false,
    }
    defaultModel.value = settings.defaultModel
    toastSuccess(t('crea.settings.savedModeration'))
  } catch (e) {
    toastError(e.message)
  } finally {
    saving.value = false
  }
}

async function saveKeying() {
  savingKeying.value = true
  try {
    // ⛔ Read BEFORE the await, and sent from the same constant. Read afterwards it is
    // whatever the box holds when the answer lands, not what was asked for - so a
    // click while the request is out would compare the server against a value nobody
    // sent, report a conflict that did not happen, and then overwrite that click.
    const asked = form.value.matchingKeyingActive
    const { data } = await saveKeyingMutation({ active: asked })
    // What the server stored, which differs from `asked` only when somebody else wrote
    // in between - the write throwing already covers the row-not-found case.
    const stored = data.setCreaMatchingKeying
    // ⚠️ And only follow the server where the box still holds what was sent. A newer
    // click belongs to the person who made it; it is unsaved, not wrong.
    if (form.value.matchingKeyingActive === asked) {
      form.value.matchingKeyingActive = stored
    }
    if (stored === asked) {
      toastSuccess(t('crea.settings.savedMatching'))
    } else {
      toastError(t('crea.settings.matchingChangedElsewhere'))
    }
  } catch (e) {
    toastError(e.message)
  } finally {
    savingKeying.value = false
  }
}

// A refusal arrives as `FIRST_CREATION_SIGNER_UNAVAILABLE: <reason>`; everything else is
// shown as it came.
function signerErrorText(error) {
  const message = error?.message ?? String(error)
  const unavailable = message.match(/FIRST_CREATION_SIGNER_UNAVAILABLE: (\w+)/)
  if (unavailable) return t('crea.settings.signerRefused', { reason: signerReason(unavailable[1]) })
  return message
}

async function saveSigner() {
  if (!signerChoice.value) return
  savingSigner.value = true
  try {
    const { data } = await signerMutation({ userId: signerChoice.value })
    signer.value = data.setFirstCreationSigner
    signerQuery.value = ''
    signerChoice.value = null
    toastSuccess(t('crea.settings.savedSigner'))
  } catch (e) {
    toastError(signerErrorText(e))
  } finally {
    savingSigner.value = false
  }
}

async function clearSigner() {
  savingSigner.value = true
  try {
    await signerMutation({ userId: null })
    signer.value = null
    toastSuccess(t('crea.settings.removedSigner'))
  } catch (e) {
    toastError(e.message)
  } finally {
    savingSigner.value = false
  }
}

async function test() {
  testing.value = true
  try {
    const { data } = await testMutation({ input: apiInput() })
    const testResult = data.testCreaModel
    if (testResult.code === 'api_inactive') {
      toastError(t('crea.settings.testInactive'))
    } else if (testResult.ok) {
      // The backend hands over codes and payload only; the sentence is built here, in
      // the moderator's language.
      const answer = testResult.message || t('crea.settings.testNoText')
      toastSuccess(t('crea.settings.testOk', { message: answer }) + fastModeNote(testResult))
    } else {
      toastError(t('crea.settings.testFail', { message: testResult.message }))
    }
  } catch (e) {
    toastError(e.message)
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.crea-settings-form {
  max-width: 640px;
}
</style>
