<template>
  <div class="contribution-form">
    <!-- <div class="my-3">
      <h3>{{ $t('contribution.formText.yourContribution') }}</h3>
      {{ $t('contribution.formText.bringYourTalentsTo') }}
      <ul class="my-3">
        <li v-html="textForMonth(new Date(minimalDate), maxGddLastMonth)"></li>
        <li v-html="textForMonth(new Date(), maxGddThisMonth)"></li>
      </ul>

      <div class="my-3">
        <b>{{ $t('contribution.formText.describeYourCommunity') }}</b>
      </div>
    </div> -->
    <b-form
      ref="form"
      @submit.prevent="submit"
      class="border p-3 bg-white appBoxShadow gradido-border-radius"
    >
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
      <div v-if="validMaxGDD > 0">
        <input-textarea
          v-model="form.memo"
          :name="$t('form.message')"
          :label="$t('contribution.activity')"
          :placeholder="$t('contribution.yourActivity')"
          :rules="{ required: true, min: 5, max: 255 }"
        />

        <!-- <validation-provider
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
      </validation-provider> -->
        <input-amount
          v-model="form.amount"
          :name="$t('form.amount')"
          :label="$t('form.amount')"
          :placeholder="'20'"
          :rules="{ required: true, gddSendAmount: [20, validMaxGDD] }"
          typ="ContributionForm"
        ></input-amount>
      </div>
      <div v-else class="mb-5">{{ $t('contribution.exhausted') }}</div>
      <!-- <validation-provider
        :name="$t('form.amount')"
        :rules="{
          required: true,
          gddSendAmount: [0.01, validMaxGDD],
        }"
        v-slot="{ errors }"
      >
        <label class="mt-3">{{ $t('form.amount') }} {{ $t('math.asterisk') }}</label>
        <b-input-group size="lg" prepend="GDD">
          <b-form-input
            id="contribution-amount"
            v-model="form.amount"
            type="number"
            :formatter="numberFormat"
            :max="validMaxGDD"
            required
          ></b-form-input>
        </b-input-group>
        <b-col v-if="errors">
          <span v-for="error in errors" class="errors" :key="error">{{ error }}</span>
        </b-col>
      </validation-provider> -->
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
import InputAmount from '@/components/Inputs/InputAmount.vue'
import InputTextarea from '@/components/Inputs/InputTextarea.vue'

const PATTERN_NON_DIGIT = /\D/g

export default {
  name: 'ContributionForm',
  components: {
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
      form: this.value, // includes 'id'
    }
  },
  methods: {
    // numberFormat(value) {
    //   return value.replace(PATTERN_NON_DIGIT, '')
    // },
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
    // textForMonth(date, availableAmount) {
    //   const obj = {
    //     monthAndYear: this.$d(date, 'monthAndYear'),
    //     creation: availableAmount,
    //   }
    //   return this.$t('contribution.formText.openAmountForMonth', obj)
    // },
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
  },
}
</script>
<style>
span.errors {
  color: red;
}
</style>
