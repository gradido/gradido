<template>
  <div class="component-edit-creation-formular">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <BForm ref="updateCreationForm">
        <div class="ms-4">
          <label>{{ $t('creation_form.select_month') }}</label>
        </div>
        <BRow class="m-4">
          <BFormRadioGroup
            v-model="selected"
            :options="creationMonths.radioOptions()"
            value-field="item"
            text-field="name"
            name="month-selection"
            :disabled="true"
          ></BFormRadioGroup>
        </BRow>
        <div class="m-4">
          <label>{{ $t('creation_form.select_value') }}</label>
          <div>
            <BInputGroup prepend="GDD" append=".00">
              <BFormInput
                v-model="value"
                type="number"
                :min="rangeMin"
                :max="rangeMax"
              ></BFormInput>
            </BInputGroup>
            <BInputGroup
              prepend="0"
              :append="String(rangeMax)"
              class="mt-3 flex-nowrap align-items-center"
            >
              <BFormInput v-model="value" type="range" :min="rangeMin" :max="rangeMax" step="10" />
            </BInputGroup>
          </div>
        </div>
        <div class="m-4">
          <label>{{ $t('creation_form.enter_text') }}</label>
          <div>
            <BFormTextarea
              id="textarea-state"
              v-model="text"
              :state="text.length >= 10"
              placeholder="Mindestens 10 Zeichen eingeben"
              rows="3"
            ></BFormTextarea>
          </div>
        </div>
        <BRow class="m-4">
          <BCol class="text-start">
            <BButton type="reset" variant="danger" @click="$refs.updateCreationForm.reset()">
              {{ $t('creation_form.reset') }}
            </BButton>
          </BCol>
          <BCol class="text-center">
            <div class="text-end">
              <BButton
                type="button"
                variant="success"
                class="test-submit"
                :disabled="submitDisabled"
                @click="submitCreation"
              >
                {{ $t('creation_form.update_creation') }}
              </BButton>
            </div>
          </BCol>
        </BRow>
      </BForm>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'

import { adminUpdateContribution } from '../graphql/adminUpdateContribution'
import { adminOpenCreations } from '../graphql/adminOpenCreations'
import { useAppToast } from '@/composables/useToast'
import useCreationMonths from '@/composables/useCreationMonths'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  row: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  creationUserData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update-creation-data'])
const creationMonths = useCreationMonths()

const { t } = useI18n()
const { toastSuccess, toastError } = useAppToast()
const text = ref(props.creationUserData.memo || '')
const value = ref(props.creationUserData.amount ? Number(props.creationUserData.amount) : 0)
const rangeMin = ref(0)

const creationIndex = computed(() => {
  const date = new Date(props.item.contributionDate)
  const month = date.toLocaleString('default', { month: 'short' })
  return creationMonths.radioOptions().findIndex((obj) => obj.item.short === month)
})

const selectedComputed = computed(() => {
  const index = creationIndex.value > -1 ? creationIndex.value : 0
  return creationMonths.radioOptions()[index].item
})
const selected = ref(selectedComputed.value)
const rangeMax = computed(
  () => Number(creationMonths.creation.value[creationIndex.value]) + Number(props.item.amount),
)

const submitDisabled = computed(() => {
  return selected.value === '' || value.value <= 0 || text.value.length < 10
})

watch(selectedComputed, () => {
  selected.value = selectedComputed.value
})

const { mutate: updateMutation, onDone, onError } = useMutation(adminUpdateContribution)
const { refetch: refetchCreations } = useQuery(adminOpenCreations, {
  userId: props.creationUserData.id,
})

onDone(() => {
  emit('update-creation-data')
  toastSuccess(t('creation_form.toasted_update', { value: value.value, email: props.item.email }))
  resetForm()
  refetchCreations()
})

onError((error) => {
  toastError(error.message)
  resetForm()
})

const submitCreation = () => {
  updateMutation({
    id: props.item.id,
    creationDate: selected.value.date,
    amount: Number(value.value),
    memo: text.value,
  })
}

const resetForm = () => {
  value.value = 0
}
</script>
