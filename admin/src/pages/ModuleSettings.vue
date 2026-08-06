<template>
  <div class="module-settings">
    <div class="h2 mb-3">{{ $t('modules.title') }}</div>
    <div v-if="isAdmin" class="module-settings-form">
      <section class="mb-5">
        <div class="h4 mb-3">{{ $t('modules.matching.title') }}</div>
        <BFormGroup class="mb-3">
          <BFormCheckbox v-model="matchingActive" switch>
            {{ $t('modules.matching.enable') }}
          </BFormCheckbox>
          <small class="text-muted d-block mt-1">{{ $t('modules.matching.hint') }}</small>
        </BFormGroup>
        <BButton variant="primary" :disabled="savingModules" @click="saveModules">
          {{ $t('save') }}
        </BButton>
      </section>

      <section class="mb-5">
        <div class="h4 mb-3">{{ $t('crea.settings.title') }}</div>
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
        <BButton variant="primary" :disabled="saving" @click="save">
          {{ $t('save') }}
        </BButton>
        <BButton variant="secondary" class="ms-2" :disabled="testing" @click="test">
          {{ $t('crea.settings.testModel') }}
        </BButton>
      </section>

      <section>
        <div class="h4 mb-3">{{ $t('modules.gms.title') }}</div>
        <p class="mb-1">{{ gmsActive ? $t('modules.gms.on') : $t('modules.gms.off') }}</p>
        <small class="text-muted d-block">{{ $t('modules.gms.hint') }}</small>
      </section>
    </div>
    <div v-else>{{ $t('modules.adminOnly') }}</div>
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
import { moduleSettings as moduleSettingsQuery, setModuleSettings } from '@/graphql/module.graphql'

const { t } = useI18n()
const store = useStore()
const { toastSuccess, toastError } = useAppToast()

const isAdmin = computed(() => store.state.moderator.roles.includes('ADMIN'))

const form = ref({ model: '', effort: 'disabled', fastMode: false })
const defaultModel = ref('')
const saving = ref(false)
const testing = ref(false)

// Module switches. matchingActive starts false so the page never shows a module as on
// before the answer is in - the same direction the backend defaults in.
const matchingActive = ref(false)
const gmsActive = ref(false)
const savingModules = ref(false)

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
      }
      defaultModel.value = settings.defaultModel
    }
  },
  { immediate: true },
)

watch(error, () => {
  if (error.value) toastError(error.value.message)
})

const { result: moduleResult, error: moduleError } = useQuery(moduleSettingsQuery, null, {
  fetchPolicy: 'network-only',
  enabled: isAdmin,
})

watch(
  moduleResult,
  () => {
    const settings = moduleResult.value?.moduleSettings
    if (settings) {
      matchingActive.value = settings.matchingActive
      gmsActive.value = settings.gmsActive
    }
  },
  { immediate: true },
)

watch(moduleError, () => {
  if (moduleError.value) toastError(moduleError.value.message)
})

const { mutate: saveMutation } = useMutation(setCreaSettings)
const { mutate: testMutation } = useMutation(testCreaModel)
const { mutate: saveModulesMutation } = useMutation(setModuleSettings)

function apiInput() {
  const model = form.value.model.trim()
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

// Saved on a button press rather than on the toggle: this switch decides what the whole
// instance offers, and a change that leaves no trace is one nobody can confirm.
async function saveModules() {
  savingModules.value = true
  try {
    const { data } = await saveModulesMutation({
      input: { matchingActive: matchingActive.value },
    })
    const settings = data.setModuleSettings
    matchingActive.value = settings.matchingActive
    gmsActive.value = settings.gmsActive
    toastSuccess(t('modules.saved'))
  } catch (e) {
    toastError(e.message)
  } finally {
    savingModules.value = false
  }
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
.module-settings-form {
  max-width: 640px;
}
</style>
