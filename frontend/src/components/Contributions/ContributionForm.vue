<template>
  <div class="container contribution-form">
    <div class="my-3">
      <h3>{{ $t('contribution.formText.h3') }}</h3>
      {{ $t('contribution.formText.text1') }}
      <ul class="my-3">
        <li>{{ $t('contribution.formText.lastMonth') }}</li>
        <li>{{ $t('contribution.formText.thisMonth') }}</li>
      </ul>

      <div class="my-3">
        <b>{{ $t('contribution.formText.text2') }}</b>
      </div>
    </div>
    <b-form ref="form" @submit.prevent="submit">
      <label>{{ $t('time.month') }}</label>
      <b-form-datepicker
        id="testdate"
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
        id="testmemo"
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
        {{ form.memo.length }}
        <span v-if="form.memo.length < minlength">{{ $t('math.equalTo') }} {{ minlength }}</span>
        <span v-else>{{ $t('math.divide') }} {{ maxlength }}</span>
      </div>
      <label class="mt-3">{{ $t('form.amount') }}</label>
      <b-input-group size="lg" prepend="GDD" append=".00">
        <b-form-input
          id="testamount"
          v-model="form.amount"
          type="number"
          min="1"
          max="1000"
        ></b-form-input>
      </b-input-group>

      <div class="mt-3 text-right">
        <b-button class="test-submit" type="submit" variant="primary" :disabled="disable">
          {{ $t('contribution.submit') }}
        </b-button>
        {{ form }}
      </div>
    </b-form>
  </div>
</template>
<script>
export default {
  name: 'ContributionForm',
  data() {
    return {
      minlength: 50,
      maxlength: 255,
      min: new Date(new Date(new Date().setMonth(new Date().getMonth() - 1)).setDate(1)),
      max: new Date(),
      form: {
        date: '',
        memo: '',
        amount: 0,
      },
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
    disable() {
      if (
        this.form.memo.length < this.minlength ||
        this.form.amount === 0 ||
        this.form.amount > 1000
      )
        return true
      return false
    },
  },
}
</script>
