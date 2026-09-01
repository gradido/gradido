<template>
  <div class="crea-settings">
    <div class="h2 mb-3">{{ $t('crea.settings.title') }}</div>
    <div v-if="isAdmin" class="crea-settings-form">
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
      <BFormGroup class="mb-3">
        <BFormCheckbox v-model="form.matchingKeyingActive">
          {{ $t('crea.settings.matchingKeying') }}
        </BFormCheckbox>
        <small class="text-muted d-block mt-1">{{ $t('crea.settings.matchingKeyingHint') }}</small>
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
  setCreaSettings,
  testCreaModel,
} from '@/graphql/crea.graphql'

const { t } = useI18n()
const store = useStore()
const { toastSuccess, toastError } = useAppToast()

const isAdmin = computed(() => store.state.moderator.roles.includes('ADMIN'))

// The form holds display defaults until the query answers, never the server's values, and
// setCreaSettings overwrites all three settings at once. So nothing here may be submitted
// before settingsLoaded turns true - otherwise one click clears the configured model and
// drops the effort level for the whole instance, confirmed by a success toast. That is not
// only a race: a query that failed leaves the defaults standing for as long as the page is
// open, because the error watcher below only raises a toast.
const form = ref({ model: '', effort: 'disabled', fastMode: false, matchingKeyingActive: false })
const defaultModel = ref('')
const settingsLoaded = ref(false)
const saving = ref(false)
const testing = ref(false)

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
      settingsLoaded.value = true
    }
  },
  { immediate: true },
)

watch(error, () => {
  if (error.value) toastError(error.value.message)
})

const { mutate: saveMutation } = useMutation(setCreaSettings)
const { mutate: testMutation } = useMutation(testCreaModel)

function apiInput() {
  const model = form.value.model.trim()
  return {
    model: model || null,
    effort: form.value.effort,
    fastMode: form.value.fastMode,
    // ⚠️ Also for `testCreaModel`, which takes the same input type. The field is
    // required there too, so leaving it out of this one place would break the test
    // button - the probe ignores the value, it just has to be present.
    matchingKeyingActive: form.value.matchingKeyingActive,
  }
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
    form.value = {
      model: settings.model ?? '',
      effort: settings.effort,
      fastMode: settings.fastMode ?? false,
      matchingKeyingActive: settings.matchingKeyingActive ?? false,
    }
    defaultModel.value = settings.defaultModel
    toastSuccess(t('crea.settings.saved'))
  } catch (e) {
    toastError(e.message)
  } finally {
    saving.value = false
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
