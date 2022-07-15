<template>
  <div class="container contribution-form">
    <div class="my-3">
      <h3>{{ $t('contribution.formText.h3') }}</h3>
      {{ $t('contribution.formText.text1') }}
      <ul class="my-3">
        <li v-html="lastMonthObject"></li>
        <li v-html="thisMonthObject"></li>
      </ul>

      <div class="my-3">
        <b>{{ $t('contribution.formText.text2') }}</b>
      </div>
    </div>
    <b-form ref="form" @submit.prevent="submit">
      <label>{{ $t('time.month') }}</label>
      <b-form-datepicker
        id="contribution-date"
        v-model="form.date"
        size="lg"
        :max="max"
        :min="min"
        class="mb-4"
        reset-value=""
        :label-no-date-selected="$t('contribution.noDateSelected')"
        required
      ></b-form-datepicker>
      <label class="mt-3">{{ $t('contribution.activity') }}</label>
      <b-form-textarea
        id="contribution-memo"
        v-model="form.memo"
        rows="3"
        max-rows="6"
        required
        :minlength="minlength"
        :maxlength="maxlength"
      ></b-form-textarea>
      <div
        class="text-right"
        :class="form.memo.length < minlength ? 'text-danger' : 'text-success'"
      >
        <span v-if="form.memo.length < minlength">{{ $t('math.equalTo') }} {{ minlength }}</span>
        <span v-else>{{ $t('math.divide') }} {{ maxlength }}</span>
      </div>
      <label class="mt-3">{{ $t('form.amount') }}</label>
      <b-input-group size="lg" prepend="GDD" append=".00">
        <b-form-input
          id="contribution-amount"
          v-model="form.amount"
          type="number"
          min="1"
          max="1000"
        ></b-form-input>
      </b-input-group>

      <div class="mt-3 text-right">
        <b-button class="test-submit" type="submit" variant="primary" :disabled="disabled">
          {{ $t('contribution.submit') }}
        </b-button>
      </div>
    </b-form>
  </div>
</template>
<script>
export default {
  name: 'ContributionForm',
  props: {
    value: { type: Object, required: true },
  },
  data() {
    return {
      minlength: 50,
      maxlength: 255,
      max: new Date(),
      form: this.value,
    }
  },
  methods: {
    submit() {
      this.$emit('set-contribution', this.form)
      this.$refs.form.reset()
      this.form.date = ''
    },
  },
  computed: {
    /*
     * lastMonth() = The date set back by one month.
     * min() = The date is reset by one month to the 1st of the previous month.
     *
     */
    lastMonth() {
      return new Date(this.max.getFullYear(), this.max.getMonth() - 1, 1)
    },
    min() {
      return new Date(this.max.getFullYear(), this.max.getMonth() - 1, 1)
    },
    disabled() {
      if (
        this.form.memo.length < this.minlength ||
        this.form.amount <= 0 ||
        this.form.amount > 1000
      )
        return true
      return false
    },
    lastMonthObject() {
      // new Date().getMonth === 1 If the current month is January, then one year must be gone back in the previous month
      const obj = {
        monthAndYear: this.$d(new Date(this.lastMonth), 'monthAndYear'),
        creation: this.$store.state.creation[1],
      }
      return this.$t('contribution.formText.lastMonth', obj)
    },
    thisMonthObject() {
      const obj = {
        monthAndYear: this.$d(new Date(), 'monthAndYear'),
        creation: this.$store.state.creation[2],
      }
      return this.$t('contribution.formText.thisMonth', obj)
    },
  },
}
</script>
