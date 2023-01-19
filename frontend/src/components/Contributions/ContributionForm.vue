<template>
  <div class="contribution-form">
    <b-form
      ref="form"
      @submit.prevent="submit"
      class="p-3 bg-white appBoxShadow gradido-border-radius"
    >
      <label>{{ $t('contribution.selectDate') }}</label>
      <b-form-datepicker
        id="contribution-date"
        v-model="form.date"
        :locale="$i18n.locale"
        :max="maximalDate"
        :min="minimalDate"
        class="mb-4 bg-248"
        reset-value=""
        :label-no-date-selected="$t('contribution.noDateSelected')"
        required
        :disabled="this.form.id !== null"
        :no-flip="true"
      >
        <template #nav-prev-year><span></span></template>
        <template #nav-next-year><span></span></template>
      </b-form-datepicker>

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
        placeholder="0.5"
        :rules="{
          required: true,
          min: 0.5,
          max: validMaxTime,
          gddCreationTime: [0.5, validMaxTime],
        }"
        :validMaxTime="validMaxTime"
        @updateAmount="updateAmount"
      ></input-hour>
      <input-amount
        id="contribution-amount"
        v-model="form.amount"
        :name="$t('form.amount')"
        :label="$t('form.amount')"
        placeholder="20"
        :rules="{ required: true, gddSendAmount: [20, validMaxGDD] }"
        typ="ContributionForm"
      ></input-amount>

      <b-row class="mt-5">
        <b-col>
          <b-button type="reset" variant="secondary" @click="reset" data-test="button-cancel">
            {{ $t('form.cancel') }}
          </b-button>
        </b-col>
        <b-col class="text-right">
          <b-button type="submit" variant="gradido" :disabled="disabled" data-test="button-submit">
            {{ form.id ? $t('form.change') : $t('contribution.submit') }}
          </b-button>
        </b-col>
      </b-row>
    </b-form>
  </div>
</template>
<script>
import InputHour from '@/components/Inputs/InputHour.vue'
import InputAmount from '@/components/Inputs/InputAmount.vue'
import InputTextarea from '@/components/Inputs/InputTextarea.vue'

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
  methods: {
    updateAmount(amount) {
      this.form.amount = (amount * 20).toFixed(2).toString()
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
  computed: {
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
  },
  watch: {
    value() {
      return (this.form = this.value)
    },
  },
}
</script>
<style>
span.errors {
  color: red;
}
</style>
