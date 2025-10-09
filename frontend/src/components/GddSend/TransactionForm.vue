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
                          :disabled="isBalanceEmpty"
                          :model-value="form.targetCommunity"
                          :community-identifier="autoCommunityIdentifier"
                          @update:model-value="updateField($event, 'targetCommunity')"
                          @communities-loaded="setCommunities"
                        />
                      </BCol>
                    </BRow>
                  </BCol>
                  <BCol v-if="radioSelected === SEND_TYPES.send" cols="12">
                    <div v-if="!userIdentifier">
                      <ValidatedInput
                        id="identifier"
                        :model-value="form.identifier"
                        name="identifier"
                        :label="$t('form.recipient')"
                        :placeholder="$t('form.identifier')"
                        :rules="validationSchema.fields.identifier"
                        :disabled="isBalanceEmpty || isCommunitiesEmpty"
                        :disable-smart-valid-state="disableSmartValidState"
                        @update:model-value="updateField"
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
                    <ValidatedInput
                      id="amount"
                      :model-value="form.amount"
                      name="amount"
                      :label="$t('form.amount')"
                      :placeholder="'0.01'"
                      :rules="validationSchema.fields.amount"
                      :disabled="isBalanceEmpty"
                      :disable-smart-valid-state="disableSmartValidState"
                      @update:model-value="updateField"
                    />
                  </BCol>
                </BRow>
              </BCol>
            </BRow>

            <BRow>
              <BCol>
                <ValidatedInput
                  id="memo"
                  :model-value="form.memo"
                  name="memo"
                  :label="$t('form.message')"
                  :placeholder="$t('form.message')"
                  :rules="validationSchema.fields.memo"
                  textarea="true"
                  :disabled="isBalanceEmpty"
                  :disable-smart-valid-state="disableSmartValidState"
                  @update:model-value="updateField"
                />
              </BCol>
            </BRow>
            <div v-if="!!isBalanceEmpty" class="text-danger mt-5">
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
              <BCol
                cols="12"
                md="6"
                lg="6"
                class="text-lg-end"
                @mouseover="disableSmartValidState = true"
              >
                <BButton block type="submit" variant="gradido" :disabled="formIsInvalid">
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
import { ref, computed, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@vue/apollo-composable'
import { SEND_TYPES } from '@/utils/sendTypes'
import CommunitySwitch from '@/components/CommunitySwitch.vue'
import ValidatedInput from '@/components/Inputs/ValidatedInput.vue'
import { memo as memoSchema, identifier as identifierSchema } from '@/validationSchemas'
import { object, number } from 'yup'
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

const entityDataToForm = computed(() => ({ ...props }))
const form = reactive({ ...entityDataToForm.value })
const disableSmartValidState = ref(false)
const communities = ref([])
const autoCommunityIdentifier = ref('')

const emit = defineEmits(['set-transaction'])

const route = useRoute()
const router = useRouter()
const { toastError } = useAppToast()

const radioSelected = ref(props.selected)
const userName = ref('')

const userIdentifier = computed(() => {
  if (route.params.userIdentifier && route.params.communityIdentifier) {
    return {
      identifier: route.params.userIdentifier,
      communityIdentifier: route.params.communityIdentifier,
    }
  }
  return null
})

function setCommunities(returnedCommunities) {
  communities.value = returnedCommunities
}

const validationSchema = computed(() => {
  const amountSchema = number()
    .required()
    .typeError({
      key: 'form.validation.amount.typeError',
      values: { min: 0.01, max: props.balance },
    })
    .transform((value, originalValue) => {
      if (typeof originalValue === 'string') {
        return Number(originalValue.replace(',', '.'))
      }
      return value
    })
    .min(0.01, ({ min }) => ({ key: 'form.validation.amount.min', values: { min } }))
    .max(props.balance, ({ max }) => ({ key: 'form.validation.amount.max', values: { max } }))
    .test('decimal-places', 'form.validation.amount.decimal-places', (value) => {
      if (value === undefined || value === null) return true
      return /^\d+(\.\d{0,2})?$/.test(value.toString())
    })
  if (!userIdentifier.value && radioSelected.value === SEND_TYPES.send) {
    return object({
      memo: memoSchema,
      amount: amountSchema,
      identifier: identifierSchema.test(
        'community-is-reachable',
        'form.validation.identifier.communityIsReachable',
        (value) => {
          const parts = value.split('/')
          // early exit if no community id is in identifier string
          if (parts.length !== 2) {
            return true
          }
          return communities.value.some((community) => {
            return (
              community.uuid === parts[0] ||
              community.name === parts[0] ||
              community.url === parts[0]
            )
          })
        },
      ),
    })
  } else {
    // don't need identifier schema if it is a transaction link or identifier was set via url
    return object({
      memo: memoSchema,
      amount: amountSchema,
    })
  }
})
const formIsInvalid = computed(() => !validationSchema.value.isValidSync(form))

const updateField = (newValue, name) => {
  if (typeof name === 'string' && name.length) {
    form[name] = newValue
  }
}

const isBalanceEmpty = computed(() => props.balance <= 0)
const isCommunitiesEmpty = computed(() => communities.value.length === 0)

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
      form.identifier = userIdentifier.value.identifier
    }
  },
  { immediate: true },
)

watch(userError, (error) => {
  if (error) {
    toastError(error.message)
  }
})

// if identifier contain valid community identifier of a reachable community:
// set it as target community and change community-switch to show only current value, instead of select
watch(
  () => form.identifier,
  (value) => {
    autoCommunityIdentifier.value = ''
    const parts = value.split('/')
    if (parts.length === 2) {
      const com = communities.value.find(
        (community) =>
          community.uuid === parts[0] || community.name === parts[0] || community.url === parts[0],
      )
      if (com) {
        form.targetCommunity = com
        autoCommunityIdentifier.value = com.uuid
      }
    }
  },
)

function onSubmit() {
  const transformedForm = validationSchema.value.cast(form)
  const parts = transformedForm.identifier.split('/')
  if (parts.length === 2) {
    transformedForm.identifier = parts[1]
    transformedForm.targetCommunity = communities.value.find((com) => {
      return com.uuid === parts[0] || com.name === parts[0] || com.url === parts[0]
    })
  }
  emit('set-transaction', {
    ...transformedForm,
    selected: radioSelected.value,
    userName: userName.value,
  })
}

function onReset(event) {
  event.preventDefault()
  form.amount = props.amount
  form.memo = props.memo
  form.identifier = props.identifier
  form.targetCommunity = props.targetCommunity
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
