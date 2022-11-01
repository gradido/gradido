<template>
  <div class="container contribution-form">
    <div class="my-3">
      <h3>{{ $t('contribution.formText.yourContribution') }}</h3>
      {{ $t('contribution.formText.bringYourTalentsTo') }}
      <ul class="my-3">
        <li v-html="textForMonth(new Date(minimalDate), maxGddLastMonth)"></li>
        <li v-html="textForMonth(new Date(), maxGddThisMonth)"></li>
      </ul>

      <div class="my-3">
        <b>{{ $t('contribution.formText.describeYourCommunity') }}</b>
      </div>
    </div>
    <b-form ref="form" @submit.prevent="submit" class="border p-3">
      <label>{{ $t('contribution.selectDate') }} {{ $t('math.asterisk') }}</label>
      <b-form-datepicker
        id="contribution-date"
        v-model="form.date"
        size="lg"
        :locale="$i18n.locale"
        :max="maximalDate"
        :min="minimalDate"
        class="mb-4"
        reset-value=""
        :label-no-date-selected="$t('contribution.noDateSelected')"
        required
        :disabled="this.form.id !== null"
      >
        <template #nav-prev-year><span></span></template>
        <template #nav-next-year><span></span></template>
      </b-form-datepicker>
      <validation-provider
        :rules="{
          min: minlength,
          max: maxlength,
        }"
        :name="$t('form.message')"
        v-slot="{ errors }"
      >
        <label class="mt-3">{{ $t('contribution.activity') }} {{ $t('math.asterisk') }}</label>
        <b-form-textarea
          id="contribution-memo"
          v-model="form.memo"
          rows="3"
          :placeholder="$t('contribution.yourActivity')"
          required
        ></b-form-textarea>
        <b-col v-if="errors">
          <span v-for="error in errors" class="errors" :key="error">{{ error }}</span>
        </b-col>
      </validation-provider>
      <validation-provider
        :name="$t('form.amount')"
        :rules="{
          required: true,
          gddSendAmount: [0.01, balance],
        }"
        v-slot="{ errors }"
      >
        <label class="mt-3">{{ $t('form.amount') }} {{ $t('math.asterisk') }}</label>
        <b-input-group size="lg" prepend="GDD">
          <b-form-input
            id="contribution-amount"
            v-model="form.amount"
            type="text"
            :formatter="numberFormat"
            required
          ></b-form-input>
        </b-input-group>
        <b-col v-if="errors">
          <span v-for="error in errors" class="errors" :key="error">{{ error }}</span>
        </b-col>
      </validation-provider>
      <div
        v-if="isThisMonth && parseInt(form.amount) > parseInt(maxGddThisMonth)"
        class="text-danger text-right"
      >
        {{ $t('contribution.formText.maxGDDforMonth', { amount: maxGddThisMonth }) }}
      </div>
      <div
        v-if="!isThisMonth && parseInt(form.amount) > parseInt(maxGddLastMonth)"
        class="text-danger text-right"
      >
        {{ $t('contribution.formText.maxGDDforMonth', { amount: maxGddLastMonth }) }}
      </div>
      <b-row class="mt-3">
        <b-col>
          <b-button type="reset" variant="secondary" @click="reset" data-test="button-cancel">
            {{ $t('form.cancel') }}
          </b-button>
        </b-col>
        <b-col class="text-right">
          <b-button type="submit" variant="primary" :disabled="disabled" data-test="button-submit">
            {{ form.id ? $t('form.change') : $t('contribution.submit') }}
          </b-button>
        </b-col>
      </b-row>
    </b-form>
    <p class="p-2">{{ $t('math.asterisk') }} {{ $t('form.mandatoryField') }}</p>
  </div>
</template>
<script>
const PATTERN_NON_DIGIT = /\D/g

export default {
  name: 'ContributionForm',
  props: {
    value: { type: Object, required: true },
    updateAmount: { type: String, required: false },
  },
  data() {
    return {
      minlength: 5,
      maxlength: 255,
      maximalDate: new Date(),
      form: this.value, // includes 'id'
    }
  },
  methods: {
    numberFormat(value) {
      return value.replace(PATTERN_NON_DIGIT, '')
    },
    submit() {
      this.form.amount = this.form.amount.replace(PATTERN_NON_DIGIT, '')
      // spreading is needed for testing
      this.$emit(this.form.id ? 'update-contribution' : 'set-contribution', { ...this.form })
      this.reset()
    },
    reset() {
      this.$refs.form.reset()
      this.form.id = null
      this.form.date = ''
      this.form.memo = ''
      this.form.amount = ''
    },
    textForMonth(date, availableAmount) {
      const obj = {
        monthAndYear: this.$d(date, 'monthAndYear'),
        creation: availableAmount,
      }
      return this.$t('contribution.formText.openAmountForMonth', obj)
    },
  },
  computed: {
    minimalDate() {
      const date = new Date(this.maximalDate)
      return new Date(date.setMonth(date.getMonth() - 1, 1))
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
    isThisMonth() {
      const formDate = new Date(this.form.date)
      return (
        formDate.getFullYear() === this.maximalDate.getFullYear() &&
        formDate.getMonth() === this.maximalDate.getMonth()
      )
    },
    maxGddLastMonth() {
      // when existing contribution is edited, the amount is added back on top of the amount
      return this.form.id && !this.isThisMonth
        ? parseInt(this.$store.state.creation[1]) + parseInt(this.updateAmount)
        : this.$store.state.creation[1]
    },
    maxGddThisMonth() {
      // when existing contribution is edited, the amount is added back on top of the amount
      return this.form.id && this.isThisMonth
        ? parseInt(this.$store.state.creation[2]) + parseInt(this.updateAmount)
        : this.$store.state.creation[2]
    },
  },
}
</script>
<style>
span.errors {
  color: red;
}
</style>
