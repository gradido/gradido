<template>
  <div class="container contribution-form">
    <b-form @submit="submit">
      <label>{{ $t('time.month') }}</label>
      <b-form-radio-group
        v-model="form.selected"
        :options="options"
        class="mb-3"
        value-field="value"
        text-field="name"
        disabled-field="notEnabled"
      ></b-form-radio-group>
      <label class="mt-3">{{ $t('contribution.activity') }}</label>
      <b-form-textarea
        id="textarea"
        v-model="form.text"
        placeholder="Enter something..."
        rows="3"
        max-rows="6"
        required
        :minlength="minlength"
      ></b-form-textarea>
      <div
        class="text-right"
        :class="form.text.length < minlength ? 'text-danger' : 'text-success'"
      >
        {{ form.text.length }}
        <span v-if="form.text.length < minlength">{{ $t('math.equalTo') }} {{ minlength }}</span>
        <span v-else>{{ $t('math.divide') }} {{ maxlength }}</span>
      </div>
      <label class="mt-3">{{ $t('form.amount') }}</label>
      <b-input-group size="lg" prepend="GDD" append=".00">
        <b-form-input v-model="form.amount" type="number" min="1" max="1000"></b-form-input>
      </b-input-group>

      <div class="mt-3 text-right">
        <b-button type="submit" variant="primary" :disabled="disable">
          {{ $t('contribution.submit') }}
        </b-button>
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
      maxlength: 500,
      form: {
        text: '',
        selected: this.$moment().format('MMMM'),
        amount: 0,
      },
      options: [
        {
          name: this.$moment().subtract(1, 'months').format('MMMM'),
          value: this.$moment().subtract(1, 'months').format('MMMM'),
        },
        { name: this.$moment().format('MMMM'), value: this.$moment().format('MMMM') },
      ],
    }
  },
  methods: {
    submit(event) {
      event.preventDefault()
      alert(JSON.stringify(this.form))
    },
  },
  computed: {
    disable() {
      if (this.form.text.length < this.minlength) return true
      if (this.form.amount < 1 && this.form.amount < 1000) return true
      return false
    },
  },
}
</script>
