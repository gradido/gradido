<template>
  <div class="transaction-form">
    <BRow>
      <BCol cols="12">
        <BCard class="app-box-shadow gradido-border-radius" body-class="p-4">
          <BForm role="form" @submit.prevent="onSubmit" @reset="onReset">
            <BFormRadioGroup
              name="shipping"
              :model-value="radioSelected"
              @update:model-value="radioSelected = $event"
            >
              <BRow class="mb-4 gap-5">
                <BCol>
                  <BRow
                    class="bg-248 gradido-border-radius position-relative transaction-form-radio"
                  >
                    <BFormRadio name="shipping" size="md" reverse :value="SEND_TYPES.send">
                      {{ $t('send_gdd') }}
                    </BFormRadio>
                  </BRow>
                </BCol>
                <BCol>
                  <BRow
                    class="bg-248 gradido-border-radius position-relative transaction-form-radio"
                  >
                    <BFormRadio name="shipping" :value="SEND_TYPES.link" size="md" reverse>
                      {{ $t('send_per_link') }}
                    </BFormRadio>
                  </BRow>
                </BCol>
              </BRow>
            </BFormRadioGroup>
            <div v-if="radioSelected === SEND_TYPES.link" class="mt-4 mb-4">
              <h2 class="alert-heading">{{ $t('gdd_per_link.header') }}</h2>
              <div>
                {{ $t('gdd_per_link.choose-amount') }}
              </div>
            </div>
            <BRow class="mb-4">
              <BCol>
                <BRow>
                  <BCol v-if="radioSelected === SEND_TYPES.send" class="mb-4" cols="12">
                    <BRow>
                      <BCol>{{ $t('form.recipientCommunity') }}</BCol>
                    </BRow>
                    <BRow>
                      <BCol class="fw-bold">
                        <community-switch
                          :disabled="isBalanceDisabled"
                          :model-value="targetCommunity"
                          @update:model-value="targetCommunity = $event"
                        />
                      </BCol>
                    </BRow>
                  </BCol>
                  <BCol v-if="radioSelected === SEND_TYPES.send" cols="12">
                    <div v-if="!userIdentifier">
                      <ValidatedInput
                        name="identifier"
                        :label="$t('form.recipient')"
                        :placeholder="$t('form.identifier')"
                        :disabled="isBalanceDisabled"
                        :rules="validationSchema.fields.identifier"
                      />
                    </div>
                    <div v-else class="mb-4">
                      <BRow class="mb-4">
                        <BCol>{{ $t('form.recipient') }}</BCol>
                      </BRow>
                      <BRow class="mb-4">
                        <BCol class="fw-bold">{{ userName }}</BCol>
                      </BRow>
                    </div>
                  </BCol>
                  <BCol cols="12" lg="6">
                    <input-amount
                      name="amount"
                      :label="$t('form.amount')"
                      :placeholder="'0.01'"
                      :rules="{ required: true, gddSendAmount: { min: 0.01, max: balance } }"
                      :disabled="isBalanceDisabled"
                    ></input-amount>
                  </BCol>
                </BRow>
              </BCol>
            </BRow>

            <BRow>
              <BCol>
                <input-textarea
                  name="memo"
                  :label="$t('form.message')"
                  :placeholder="$t('form.message')"
                  :rules="{ required: true, min: 5, max: 255 }"
                  :disabled="isBalanceDisabled"
                />
              </BCol>
            </BRow>
            <div v-if="!!isBalanceDisabled" class="text-danger mt-5">
              {{ $t('form.no_gdd_available') }}
            </div>
            <BRow v-else class="test-buttons mt-3">
              <BCol cols="12" md="6" lg="6">
                <BButton
                  block
                  type="reset"
                  variant="secondary"
                  class="mb-3 mb-md-0 mb-lg-0"
                  @click="onReset"
                >
                  {{ $t('form.reset') }}
                </BButton>
              </BCol>
              <BCol cols="12" md="6" lg="6" class="text-lg-end">
                <BButton block type="submit" variant="gradido">
                  {{ $t('form.check_now') }}
                </BButton>
              </BCol>
            </BRow>
          </BForm>
        </BCard>
      </BCol>
    </BRow>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@vue/apollo-composable'
import { useForm } from 'vee-validate'
import { SEND_TYPES } from '@/utils/sendTypes'
import { object, number } from 'yup'
import { memo as memoSchema, identifier as identifierSchema } from '@/validationSchemas'
import ValidatedInput from '@/components/Inputs/ValidatedInput'
import InputIdentifier from '@/components/Inputs/InputIdentifier'
import InputAmount from '@/components/Inputs/InputAmount'
import InputTextarea from '@/components/Inputs/InputTextarea'
import CommunitySwitch from '@/components/CommunitySwitch.vue'
import { user } from '@/graphql/queries'
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  balance: { type: Number, default: 0 },
  identifier: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  memo: { type: String, default: '' },
  selected: { type: String, default: 'send' },
  targetCommunity: {
    type: Object,
    default: () => ({ uuid: '', name: CONFIG.COMMUNITY_NAME }),
  },
})

const emit = defineEmits(['set-transaction'])

const route = useRoute()
const router = useRouter()
const { toastError } = useAppToast()

const radioSelected = ref(props.selected)
const userName = ref('')
const recipientCommunity = ref({ uuid: '', name: '' })

const validationSchema = computed(() =>
  object({
    identifier: identifierSchema,
    memo: memoSchema,
    amount: number().min(0.01).max(props.balance),
  }),
)

const { handleSubmit, resetForm, defineField, values } = useForm({
  initialValues: {
    identifier: props.identifier,
    amount: props.amount ? String(props.amount) : '',
    memo: props.memo,
    targetCommunity: props.targetCommunity,
  },
})

const [targetCommunity, targetCommunityProps] = defineField('targetCommunity')

const userIdentifier = computed(() => {
  if (route.params.userIdentifier && route.params.communityIdentifier) {
    return {
      identifier: route.params.userIdentifier,
      communityIdentifier: route.params.communityIdentifier,
    }
  }
  return null
})

const isBalanceDisabled = computed(() => props.balance <= 0)

const { result: userResult, error: userError } = useQuery(
  user,
  () => userIdentifier.value,
  () => ({ enabled: !!userIdentifier.value }),
)

watch(
  () => userResult.value?.user,
  (user) => {
    if (user) {
      userName.value = `${user.firstName} ${user.lastName}`
    }
  },
  { immediate: true },
)

watch(userError, (error) => {
  if (error) {
    toastError(error.message)
  }
})

const onSubmit = handleSubmit((formValues) => {
  if (userIdentifier.value) formValues.identifier = userIdentifier.value.identifier
  emit('set-transaction', {
    selected: radioSelected.value,
    ...formValues,
    amount: Number(formValues.amount.replace(',', '.')),
    userName: userName.value,
  })
})

function onReset(event) {
  event.preventDefault()
  resetForm()
  radioSelected.value = SEND_TYPES.send
  router.replace('/send')
}
</script>

<style>
span.errors {
  color: red;
}

#input-1:focus,
#input-2:focus,
#input-3:focus {
  font-weight: bold;
}

.border-radius {
  border-radius: 10px;
}

label {
  display: block;
  text-align: start;
  padding: 8px 15px;
}

.form-check-input:checked {
  display: none;
}

.form-check-input:checked ~ .form-check-label::before {
  content: '';
  color: #678000;
  background-color: transparent;
  border: 1px #678000 solid;
  width: 14px;
  height: 14px;
  border-radius: 100%;
  right: 12px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.form-check .form-check-input:checked ~ .form-check-label::after {
  content: '\2714';
  margin-left: 5px;
  color: #678000;
  right: 10px;
  position: absolute;
  top: 50%;
  transform: translateY(-60%);
}

.transaction-form-radio {
  background-color: #f8f8f8;
  margin-right: 0;
  margin-bottom: 0;
  position: relative;
  display: flex !important;
  justify-content: space-between;
}

.transaction-form-radio > div > input {
  position: absolute;
  right: 35px;
  top: 50%;
  transform: translateY(-70%);
}
</style>

<style scoped>
:deep(label.form-check-label) {
  width: 100%;
  cursor: pointer;
}
</style>
