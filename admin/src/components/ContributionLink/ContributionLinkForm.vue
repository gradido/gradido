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
            :disabled="disabled"
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
      </div>
    </BForm>
  </div>
</template>
<!--<script>-->
<!--import { createContributionLink } from '@/graphql/createContributionLink.js'-->
<!--import { updateContributionLink } from '@/graphql/updateContributionLink.js'-->

<!--export default {-->
<!--  name: 'ContributionLinkForm',-->
<!--  props: {-->
<!--    contributionLinkData: {-->
<!--      type: Object,-->
<!--      default() {-->
<!--        return {}-->
<!--      },-->
<!--    },-->
<!--    editContributionLink: { type: Boolean, required: true },-->
<!--  },-->
<!--  emits: ['close-contribution-form', 'close-contribution-link', 'get-contribution-links'],-->
<!--  data() {-->
<!--    return {-->
<!--      form: {-->
<!--        name: null,-->
<!--        memo: null,-->
<!--        amount: null,-->
<!--        validFrom: null,-->
<!--        validTo: null,-->
<!--        cycle: 'ONCE',-->
<!--        maxPerCycle: 1,-->
<!--        maxAmountPerMonth: '0',-->
<!--      },-->
<!--      min: new Date(),-->
<!--      cycle: [-->
<!--        { value: 'ONCE', text: this.$t('contributionLink.options.cycle.once') },-->
<!--        //        { value: 'hourly', text: this.$t('contributionLink.options.cycle.hourly') },-->
<!--        { value: 'DAILY', text: this.$t('contributionLink.options.cycle.daily') },-->
<!--        //        { value: 'weekly', text: this.$t('contributionLink.options.cycle.weekly') },-->
<!--        //        { value: 'monthly', text: this.$t('contributionLink.options.cycle.monthly') },-->
<!--        //        { value: 'yearly', text: this.$t('contributionLink.options.cycle.yearly') },-->
<!--      ],-->
<!--      maxPerCycle: [-->
<!--        { value: '1', text: '1 x' },-->
<!--        //        { value: '2', text: '2 x' },-->
<!--        //        { value: '3', text: '3 x' },-->
<!--        //        { value: '4', text: '4 x' },-->
<!--        //        { value: '5', text: '5 x' },-->
<!--      ],-->
<!--    }-->
<!--  },-->
<!--  computed: {-->
<!--    disabled() {-->
<!--      return true-->
<!--    },-->
<!--  },-->
<!--  watch: {-->
<!--    contributionLinkData() {-->
<!--      this.form = this.contributionLinkData-->
<!--    },-->
<!--  },-->
<!--  methods: {-->
<!--    onSubmit() {-->
<!--      if (this.form.validFrom === null)-->
<!--        return this.toastError(this.$t('contributionLink.noStartDate'))-->
<!--      if (this.form.validTo === null) return this.toastError(this.$t('contributionLink.noEndDate'))-->

<!--      const variables = {-->
<!--        ...this.form,-->
<!--        id: this.contributionLinkData.id ? this.contributionLinkData.id : null,-->
<!--      }-->

<!--      this.$apollo-->
<!--        .mutate({-->
<!--          mutation: this.editContributionLink ? updateContributionLink : createContributionLink,-->
<!--          variables: variables,-->
<!--        })-->
<!--        .then((result) => {-->
<!--          const link = this.editContributionLink-->
<!--            ? result.data.updateContributionLink.link-->
<!--            : result.data.createContributionLink.link-->
<!--          this.toastSuccess(-->
<!--            this.editContributionLink ? this.$t('contributionLink.changeSaved') : link,-->
<!--          )-->
<!--          this.onReset()-->
<!--          this.$root.$emit('bv::toggle::collapse', 'newContribution')-->
<!--          this.$emit('get-contribution-links')-->
<!--        })-->
<!--        .catch((error) => {-->
<!--          this.toastError(error.message)-->
<!--        })-->
<!--    },-->
<!--    onReset() {-->
<!--      this.$refs.contributionLinkForm.reset()-->
<!--      this.form = {}-->
<!--      this.form.validFrom = null-->
<!--      this.form.validTo = null-->
<!--    },-->
<!--  },-->
<!--}-->
<!--</script>-->

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

const emit = defineEmits([
  'bv::toggle::collapse',
  'get-contribution-links',
  'close-contribution-form',
])

const { t } = useI18n()

const contributionLinkForm = ref(null)

const form = ref({
  name: null,
  memo: null,
  amount: null,
  validFrom: null,
  validTo: null,
  cycle: 'ONCE',
  maxPerCycle: 1,
  maxAmountPerMonth: '0',
})

const min = new Date().toLocaleDateString()
const { toastError, toastSuccess } = useAppToast()

const cycle = ref([
  { value: 'ONCE', text: t('contributionLink.options.cycle.once') },
  { value: 'DAILY', text: t('contributionLink.options.cycle.daily') },
])

const maxPerCycle = ref([{ value: '1', text: '1 x' }])

// Set client
const { mutate: contributionLinkMutation } = useMutation(
  props.editContributionLink ? updateContributionLink : createContributionLink,
)

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
    maxAmountPerMonth: 1, // TODO this is added only for test puropuse during migration since max amount input is commented out but without it being a number bigger then 0 it doesn't work
    id: props.contributionLinkData.id ? props.contributionLinkData.id : null,
  }

  try {
    const result = await contributionLinkMutation({ ...variables })
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
