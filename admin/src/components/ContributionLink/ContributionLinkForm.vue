<template>
  <div class="contribution-link-form">
    <BForm ref="contributionLinkForm" class="m-5" @submit.prevent="onSubmit" @reset="onReset">
      <!-- Date -->
      <BRow>
        <BCol>
          <BFormGroup :label="$t('contributionLink.validFrom')">
            <BFormInput
              v-model="form.validFrom"
              reset-button
              size="lg"
              :min="min"
              class="mb-4 test-validFrom"
              reset-value=""
              :label-no-date-selected="$t('contributionLink.noDateSelected')"
              required
              type="date"
            />
          </BFormGroup>
        </BCol>
        <BCol>
          <BFormGroup :label="$t('contributionLink.validTo')">
            <BFormInput
              v-model="form.validTo"
              reset-button
              size="lg"
              :min="form.validFrom ? form.validFrom : min"
              class="mb-4 test-validTo"
              reset-value=""
              :label-no-date-selected="$t('contributionLink.noDateSelected')"
              required
              type="date"
            />
          </BFormGroup>
        </BCol>
      </BRow>

      <!-- Name -->
      <BFormGroup :label="$t('contributionLink.name')">
        <BFormInput
          v-model="form.name"
          size="lg"
          type="text"
          placeholder="Name"
          required
          maxlength="100"
          class="test-name"
        ></BFormInput>
      </BFormGroup>
      <!-- Desc -->
      <BFormGroup :label="$t('contributionLink.memo')">
        <BFormTextarea
          v-model="form.memo"
          size="lg"
          :placeholder="$t('contributionLink.memo')"
          required
          maxlength="255"
          class="test-memo"
        ></BFormTextarea>
      </BFormGroup>
      <!-- Amount -->
      <BFormGroup :label="$t('contributionLink.amount')">
        <BFormInput
          v-model="form.amount"
          size="lg"
          type="number"
          placeholder="0"
          required
          class="test-amount"
        ></BFormInput>
      </BFormGroup>
      <BRow class="mb-4">
        <BCol>
          <!-- Cycle -->
          <label for="cycle">{{ $t('contributionLink.cycle') }}</label>
          <BFormSelect v-model="form.cycle" :options="cycle" class="mb-3" size="lg"></BFormSelect>
        </BCol>
        <BCol>
          <!-- maxPerCycle -->
          <label for="maxPerCycle">{{ $t('contributionLink.maxPerCycle') }}</label>
          <BFormSelect
            v-model="form.maxPerCycle"
            :options="maxPerCycle"
            disabled
            class="mb-3"
            size="lg"
          ></BFormSelect>
        </BCol>
      </BRow>

      <!-- Max amount -->
      <!-- 
          <BFormGroup :label="$t('contributionLink.maximumAmount')">
            <BFormInput
              v-model="form.maxAmountPerMonth"
              size="lg"
              :disabled="disabled"
              type="number"
              placeholder="0"
            ></BFormInput>
          </BFormGroup>
          -->
      <div class="mt-6">
        <BButton type="submit" variant="primary">
          {{
            editContributionLink ? $t('contributionLink.saveChange') : $t('contributionLink.create')
          }}
        </BButton>
        <BButton type="reset" variant="danger">
          {{ $t('contributionLink.clear') }}
        </BButton>
        <BButton @click.prevent="emit('close-contribution-form')">
          {{ $t('close') }}
        </BButton>
        {{ console.log(editContributionLink) }}
      </div>
    </BForm>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { createContributionLink } from '@/graphql/createContributionLink.js'
import { updateContributionLink } from '@/graphql/updateContributionLink.js'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  contributionLinkData: {
    type: Object,
    default: () => ({}),
  },
  editContributionLink: { type: Boolean, required: true },
})

const emit = defineEmits(['get-contribution-links', 'close-contribution-form'])

const { t } = useI18n()

const contributionLinkForm = ref(null)

const form = ref({
  name: null,
  memo: null,
  amount: null,
  validFrom: null,
  validTo: null,
  cycle: 'ONCE',
  maxAmountPerMonth: '0',
})

const min = new Date().toLocaleDateString()
const { toastError, toastSuccess } = useAppToast()

const cycle = ref([
  { value: 'ONCE', text: t('contributionLink.options.cycle.once') },
  { value: 'DAILY', text: t('contributionLink.options.cycle.daily') },
])

const maxPerCycle = ref([{ value: '1', text: '1 x' }])

const { mutate: contributionLinkMutation } = useMutation(createContributionLink)

const { mutate: contributionLinkMutationUpdate } = useMutation(updateContributionLink)

watch(
  () => props.contributionLinkData,
  (newVal) => {
    form.value = newVal
    form.value.validFrom = formatDateFromDateTime(newVal.validFrom)
    form.value.validTo = formatDateFromDateTime(newVal.validTo)
  },
)

const onSubmit = async () => {
  if (form.value.validFrom === null) return toastError(t('contributionLink.noStartDate'))

  if (form.value.validTo === null) return toastError(t('contributionLink.noEndDate'))

  const variables = {
    ...form.value,
    // maxAmountPerMonth: 1, // TODO this is added only for test puropuse during migration since max amount input is commented out but without it being a number bigger then 0 it doesn't work
    id: props.contributionLinkData.id ? props.contributionLinkData.id : null,
  }

  try {
    const mutationType = props.editContributionLink
      ? contributionLinkMutationUpdate
      : contributionLinkMutation
    const result = await mutationType({ ...variables })
    const link = props.editContributionLink
      ? result.data.updateContributionLink.link
      : result.data.createContributionLink.link
    toastSuccess(props.editContributionLink ? t('contributionLink.changeSaved') : link)
    onReset()
    emit('close-contribution-form')
    emit('get-contribution-links')
  } catch (error) {
    toastError(error.message)
  }
}

const formatDateFromDateTime = (datetimeString) => {
  if (!datetimeString || !datetimeString?.includes('T')) return datetimeString
  return datetimeString.split('T')[0]
}

const onReset = () => {
  form.value = { validFrom: null, validTo: null }
}

defineExpose({
  form,
  min,
  cycle,
  maxPerCycle,
  onSubmit,
})
</script>
