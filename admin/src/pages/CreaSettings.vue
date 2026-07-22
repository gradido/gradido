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
      <BButton variant="primary" :disabled="saving" @click="save">
        {{ $t('save') }}
      </BButton>
      <BButton variant="secondary" class="ms-2" :disabled="testing" @click="test">
        {{ $t('crea.settings.testModel') }}
      </BButton>
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

const form = ref({ model: '', effort: 'disabled' })
const defaultModel = ref('')
const saving = ref(false)
const testing = ref(false)

const modelPresetOptions = computed(() => [
  { value: '', text: t('crea.settings.presetPlaceholder') },
  { value: 'claude-sonnet-5', text: 'claude-sonnet-5' },
  { value: 'claude-opus-4-8', text: 'claude-opus-4-8' },
  { value: 'claude-haiku-4-5', text: 'claude-haiku-4-5' },
  { value: 'claude-fable-5', text: 'claude-fable-5' },
  { value: 'claude-opus-4-7', text: 'claude-opus-4-7' },
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
      form.value = { model: settings.model ?? '', effort: settings.effort ?? 'disabled' }
      defaultModel.value = settings.defaultModel
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
  return { model: model || null, effort: form.value.effort }
}

function onPreset(value) {
  if (value) form.value.model = value
}

async function save() {
  saving.value = true
  try {
    const { data } = await saveMutation({ input: apiInput() })
    const settings = data.setCreaSettings
    form.value = { model: settings.model ?? '', effort: settings.effort }
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
    if (testResult.ok) {
      toastSuccess(t('crea.settings.testOk', { message: testResult.message }))
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
