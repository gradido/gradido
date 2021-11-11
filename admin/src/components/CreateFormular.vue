<template>
  <div>
    <b-form>
      <b-row class="m-4">
        <b-col>
          <b-form-radio name="radio-size" size="lg">{{ MonatBevorLast }}</b-form-radio>
        </b-col>
        <b-col>
          <b-form-radio name="radio-size" size="lg">{{ MonatLast }}</b-form-radio>
        </b-col>
        <b-col>
          <b-form-radio name="radio-size" size="lg">{{ MonatAktuell }}</b-form-radio>
        </b-col>
      </b-row>
      <b-row class="m-4">
        <div>
          <b-form-textarea
            id="textarea-state"
            v-model="text"
            :state="text.length >= 10"
            placeholder="Enter at least 10 characters"
            rows="3"
          ></b-form-textarea>
        </div>
      </b-row>
      <b-row class="m-4">
        <label for="range-2 h4">
          Betrag Auswählen
          <span class="mt-2 h3" v-if="value > 0">{{ value }} GDD</span>
        </label>
        <b-input
          id="range-2"
          v-model="value"
          type="range"
          min="0"
          max="1000"
          step="10"
          class="mr-4 ml-4"
        ></b-input>
      </b-row>
      <b-row class="m-4">
        <b-col class="text-center"><b-button type="reset" variant="danger">Reset</b-button></b-col>
        <b-col class="text-center">
          <div class="text-right">
            <b-button type="submit" variant="primary">Submit</b-button>
          </div>
        </b-col>
      </b-row>
    </b-form>
  </div>
</template>
<script>
export default {
  name: 'CreateFormular',
  data() {
    return {
      text: 'datatext',
      value: 0,
      MonatAktuell: this.$moment().format('MMMM'),
      MonatLast: this.$moment().subtract(1, 'month').format('MMMM'),
      MonatBevorLast: this.$moment().subtract(2, 'month').format('MMMM'),
    }
  },
  created() {},
}
</script>
