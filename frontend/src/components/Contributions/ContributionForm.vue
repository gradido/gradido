<template>
  <div class="contribution-form">
    <BForm
      ref="form"
      class="form-style p-3 bg-white app-box-shadow gradido-border-radius"
      @submit.prevent="submit"
    >
      <label>{{ $t('contribution.selectDate') }}</label>
      <BFormInput
        id="contribution-date"
        v-model="form.date"
        :locale="$i18n.locale"
        :max="maximalDate"
        :min="minimalDate"
        class="mb-4 bg-248"
        reset-value=""
        :label-no-date-selected="$t('contribution.noDateSelected')"
        required
        :no-flip="true"
        type="date"
      >
        <template #nav-prev-year><span></span></template>
        <template #nav-next-year><span></span></template>
      </BFormInput>

      <div v-if="showMessage" class="p-3" data-test="contribtion-message">
        {{ noOpenCreation }}
      </div>
      <div v-else>
        <input-textarea
          id="contribution-memo"
          v-model="form.memo"
          :name="$t('form.message')"
          :label="$t('contribution.activity')"
          :placeholder="$t('contribution.yourActivity')"
          :rules="{ required: true, min: 5, max: 255 }"
        />
        <input-hour
          v-model="form.hours"
          :name="$t('form.hours')"
          :label="$t('form.hours')"
          placeholder="0.25"
          :rules="{
            required: true,
            min: 0.25,
            max: validMaxTime,
            gddCreationTime: [0.25, validMaxTime],
          }"
          :valid-max-time="validMaxTime"
          @updateAmount="updateAmount"
        ></input-hour>
        <input-amount
          id="contribution-amount"
          v-model="form.amount"
          name="amount"
          :label="$t('form.amount')"
          placeholder="20"
          :rules="{ required: true, gddSendAmount: { min: 20, max: validMaxGDD } }"
          typ="ContributionForm"
        ></input-amount>

        <BRow class="mt-5">
          <BCol cols="12" lg="6">
            <BButton
              block
              type="reset"
              variant="secondary"
              data-test="button-cancel"
              @click="reset"
            >
              {{ $t('form.cancel') }}
            </BButton>
          </BCol>
          <BCol cols="12" lg="6" class="text-right mt-4 mt-lg-0">
            <BButton
              block
              type="submit"
              variant="gradido"
              :disabled="disabled"
              data-test="button-submit"
            >
              {{ form.id ? $t('form.change') : $t('contribution.submit') }}
            </BButton>
          </BCol>
        </BRow>
      </div>
    </BForm>
  </div>
</template>
<script>
import InputHour from '@/components/Inputs/InputHour'
import InputAmount from '@/components/Inputs/InputAmount'
import InputTextarea from '@/components/Inputs/InputTextarea'

export default {
  name: 'ContributionForm',
  components: {
    InputHour,
    InputAmount,
    InputTextarea,
  },
  props: {
    value: { type: Object, required: true },
    isThisMonth: { type: Boolean, required: true },
    minimalDate: { type: Date, required: true },
    maxGddLastMonth: { type: Number, required: true },
    maxGddThisMonth: { type: Number, required: true },
  },
  data() {
    return {
      minlength: 5,
      maxlength: 255,
      maximalDate: new Date(),
      form: this.value, // includes 'id' and time
    }
  },
  computed: {
    showMessage() {
      if (this.maxGddThisMonth <= 0 && this.maxGddLastMonth <= 0) return true
      if (this.form.date)
        return (
          (this.isThisMonth && this.maxGddThisMonth <= 0) ||
          (!this.isThisMonth && this.maxGddLastMonth <= 0)
        )
      return false
    },
    disabled() {
      return (
        this.form.date === '' ||
        this.form.memo.length < this.minlength ||
        this.form.memo.length > this.maxlength ||
        this.form.amount === '' ||
        parseInt(this.form.amount) <= 0 ||
        parseInt(this.form.amount) > 1000 ||
        (this.isThisMonth && parseInt(this.form.amount) > parseInt(this.maxGddThisMonth)) ||
        (!this.isThisMonth && parseInt(this.form.amount) > parseInt(this.maxGddLastMonth))
      )
    },
    validMaxGDD() {
      return Number(this.isThisMonth ? this.maxGddThisMonth : this.maxGddLastMonth)
    },
    validMaxTime() {
      return Number(this.validMaxGDD / 20)
    },
    noOpenCreation() {
      if (this.maxGddThisMonth <= 0 && this.maxGddLastMonth <= 0) {
        return this.$t('contribution.noOpenCreation.allMonth')
      }
      if (this.isThisMonth && this.maxGddThisMonth <= 0) {
        return this.$t('contribution.noOpenCreation.thisMonth')
      }
      if (!this.isThisMonth && this.maxGddLastMonth <= 0) {
        return this.$t('contribution.noOpenCreation.lastMonth')
      }
      return ''
    },
  },
  watch: {
    value() {
      return (this.form = this.value)
    },
  },
  methods: {
    updateAmount(hours) {
      this.form.amount = (hours * 20).toFixed(2).toString()
    },
    submit() {
      this.$emit(this.form.id ? 'update-contribution' : 'set-contribution', { ...this.form })
      this.reset()
    },
    reset() {
      this.$refs.form.reset()
      this.form.id = null
      this.form.date = ''
      this.form.memo = ''
      this.form.hours = 0
      this.form.amount = ''
    },
  },
}
</script>
<style>
.form-style {
  min-height: 410px;
}

span.errors {
  color: red;
}
</style>
