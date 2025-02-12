<template>
  <div class="component-creation-formular">
    {{ $t('creation_form.form') }}
    <div class="shadow p-3 mb-5 bg-white rounded">
      <BForm ref="creationForm">
        <div class="m-4 mt-0">
          <label>{{ $t('creation_form.select_month') }}</label>
          <BFormRadioGroup
            id="radio-group-month-selection"
            v-model="selected"
            :options="radioOptions"
            value-field="item"
            text-field="name"
            name="month-selection"
          />
        </div>
        <div v-if="selected" class="m-4 d-flex">
          <label>{{ $t('creation_form.select_value') }}</label>
          <div>
            <BInputGroup prepend="GDD" append=".00">
              <BFormInput v-model="value" type="number" :min="rangeMin" :max="rangeMax" />
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
              :placeholder="$t('creation_form.min_characters')"
              rows="3"
            />
          </div>
        </div>
        <div class="buttons-wrapper d-flex justify-content-between">
          <BButton type="reset" variant="danger" @click="onReset()">
            {{ $t('creation_form.reset') }}
          </BButton>
          <div>
            <BButton
              type="button"
              variant="success"
              class="test-submit"
              :disabled="disabled"
              @click="submitCreation"
            >
              {{ submitBtnText }}
            </BButton>
          </div>
        </div>
      </BForm>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import { adminCreateContribution } from '../graphql/adminCreateContribution'
import { adminOpenCreations } from '../graphql/adminOpenCreations'
import useCreationMonths from '../composables/useCreationMonths'
import {
  BFormInput,
  BFormRadioGroup,
  BForm,
  BInputGroup,
  BButton,
  BFormTextarea,
} from 'bootstrap-vue-next'

const { creationDateObjects } = useCreationMonths()
const { toastError, toastSuccess } = useAppToast()

const props = defineProps({
  pagetype: {
    type: String,
    required: false,
    default: '',
  },
  item: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  items: {
    type: Array,
    required: false,
    default: () => [],
  },
  creationUserData: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  creation: {
    type: Object,
    required: true,
  },
})

const { t } = useI18n()
const store = useStore()

const text = ref(!props.creationUserData.memo ? '' : props.creationUserData.memo)
const value = ref(!props.creationUserData.amount ? 0 : props.creationUserData.amount)
const rangeMin = ref(0)
const rangeMax = ref(1000)
const selected = ref(null)
const creationForm = ref(null)

const radioOptions = computed(() => {
  return creationDateObjects.value.map((obj, idx) => {
    return {
      item: { ...obj, creation: props.creation[idx] },
      name: obj.short + (props.creation[idx] ? ' ' + props.creation[idx] + ' GDD' : ''),
    }
  })
})

const disabled = computed(() => {
  return selected.value === '' || value.value <= 0 || text.value.length < 10
})

const submitBtnText = computed(() => {
  return props.pagetype === 'PageCreationConfirm'
    ? t('creation_form.update_creation')
    : t('creation_form.submit_creation')
})

const updateRadioSelected = (name) => {
  text.value = `${t('creation_form.creation_for')} ${name?.short} ${name?.year}`
  rangeMin.value = 0
  rangeMax.value = Number(name?.creation)
}

const onReset = () => {
  text.value = ''
  value.value = 0
  selected.value = null
}
const { mutate: createContribution } = useMutation(adminCreateContribution)

const { refetch: refetchCreations } = useQuery(adminOpenCreations, { userId: props.item.userId })
const emit = defineEmits(['update-user-data'])

const submitCreation = async () => {
  try {
    const result = await createContribution({
      email: props.item.email,
      creationDate: selected.value.date,
      amount: Number(value.value),
      memo: text.value,
    })

    emit('update-user-data', props.item, result.data.adminCreateContribution)

    store.commit('openCreationsPlus', 1)

    toastSuccess(
      t('creation_form.toasted', {
        value: value.value,
        email: props.item.email,
      }),
    )

    onReset()
  } catch (error) {
    toastError(error.message)
    onReset()
  } finally {
    refetchCreations()
    selected.value = ''
  }
}

watch(
  () => selected.value,
  async (newValue, oldValue) => {
    if (newValue !== oldValue && selected.value !== '' && selected.value !== null) {
      updateRadioSelected(newValue)
    }
  },
)

defineExpose({ submitCreation })
</script>
<style scoped>
.buttons-wrapper {
  margin: 1.5rem 2.4rem;
}
</style>
