<template>
  <div class="container contribution-form">
    <div class="my-3">
      <h3>{{ $t('contribution.formText.yourContribution') }}</h3>
      {{ $t('contribution.formText.bringYourTalentsTo') }}
      <ul class="my-3">
        <li v-html="lastMonthObject"></li>
        <li v-html="thisMonthObject"></li>
      </ul>

      <div class="my-3">
        <b>{{ $t('contribution.formText.describeYourCommunity') }}</b>
      </div>
    </div>
    <b-form ref="form" @submit.prevent="submit" class="border p-3">
      <label>{{ $t('contribution.selectDate') }}</label>
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
      ></b-form-datepicker>
      <validation-provider
        :rules="{
          required: true,
          min: minlength,
          max: maxlength,
        }"
        :name="$t('form.message')"
        v-slot="{ errors }"
      >
        <label class="mt-3">{{ $t('contribution.activity') }}</label>
        <b-form-textarea
          id="contribution-memo"
          v-model="form.memo"
          rows="3"
          max-rows="6"
          required
        ></b-form-textarea>
        <b-col v-if="errors">
          <span v-for="error in errors" class="errors" :key="error">{{ error }}</span>
        </b-col>
      </validation-provider>
      <label class="mt-3">{{ $t('form.amount') }}</label>
      <b-input-group size="lg" prepend="GDD" append=".00">
        <b-form-input
          id="contribution-amount"
          v-model="form.amount"
          type="number"
          min="1"
          :max="isThisMonth ? maxGddThisMonth : maxGddLastMonth"
        ></b-form-input>
      </b-input-group>
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
          <b-button class="test-cancel" type="reset" variant="secondary" @click="reset">
            {{ $t('form.cancel') }}
          </b-button>
        </b-col>
        <b-col class="text-right">
          <b-button class="test-submit" type="submit" variant="primary" :disabled="disabled">
            {{ form.id ? $t('form.change') : $t('contribution.submit') }}
          </b-button>
        </b-col>
      </b-row>
    </b-form>
  </div>
</template>
<script>
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
    submit() {
      if (this.form.id) {
        this.$emit('update-contribution', this.form)
      } else {
        this.$emit('set-contribution', this.form)
      }
      this.reset()
    },
    reset() {
      this.$refs.form.reset()
      this.form.id = null
      this.form.date = ''
      this.form.memo = ''
      this.form.amount = ''
    },
  },
  computed: {
    /*
     * minimalDate() = Sets the date to the 1st of the previous month.
     *
     */
    minimalDate() {
      return new Date(this.maximalDate.getFullYear(), this.maximalDate.getMonth() - 1, 1)
    },
    disabled() {
      if (
        this.form.date === '' ||
        this.form.memo.length < this.minlength ||
        this.form.amount <= 0 ||
        this.form.amount > 1000 ||
        (this.isThisMonth && parseInt(this.form.amount) > parseInt(this.maxGddThisMonth)) ||
        (!this.isThisMonth && parseInt(this.form.amount) > parseInt(this.maxGddLastMonth))
      )
        return true
      return false
    },
    lastMonthObject() {
      // new Date().getMonth === 1 If the current month is January, then one year must be gone back in the previous month
      const obj = {
        monthAndYear: this.$d(new Date(this.minimalDate), 'monthAndYear'),
        creation: this.maxGddLastMonth,
      }
      return this.$t('contribution.formText.openAmountForMonth', obj)
    },
    thisMonthObject() {
      const obj = {
        monthAndYear: this.$d(new Date(), 'monthAndYear'),
        creation: this.maxGddThisMonth,
      }
      return this.$t('contribution.formText.openAmountForMonth', obj)
    },
    isThisMonth() {
      return new Date(this.form.date).getMonth() === new Date().getMonth()
    },
    maxGddLastMonth() {
      // When edited, the amount is added back on top of the amount
      return this.form.id && !this.isThisMonth
        ? parseInt(this.$store.state.creation[1]) + parseInt(this.updateAmount)
        : this.$store.state.creation[1]
    },
    maxGddThisMonth() {
      // When edited, the amount is added back on top of the amount
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
