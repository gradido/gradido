<template>
  <div role="group" class="input-job">
    <label for="input-lastName">Job:</label>
    <b-form-input
      id="input-job"
      v-model="job"
      :state="jobState"
      aria-describedby="input-live-help input-live-feedback"
      placeholder="Enter your Job"
      trim
    ></b-form-input>

    <!-- This will only be shown if the preceding input has an invalid state -->
    <b-form-invalid-feedback id="input-live-feedback">
      Enter at least 3 letters
    </b-form-invalid-feedback>

    <!-- This is a form text block (formerly known as help block) -->
    <b-form-text id="input-live-help">Was ist dein Beruf</b-form-text>
  </div>
</template>

<script>
export default {
  name: 'Job',
  props: {
    value: { type: String, default: '' },
  },
  data() {
    return {
      job: this.value,
    }
  },
  computed: {
    jobState() {
      return this.job.length > 2
    },
  },
}
</script>
