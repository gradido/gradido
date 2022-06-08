<template>
  <div class="contribution-link-form">
    <div v-if="updateData" class="text-light bg-info p-3">
      {{ updateData }}
    </div>
    <b-form class="m-5" @submit.prevent="onSubmit" ref="contributionLinkForm">
      <!-- Date -->
      <b-row>
        <b-col>
          <b-form-group :label="$t('contributionLink.startDate')">
            <b-form-datepicker
              v-model="form.startDate"
              size="lg"
              :min="min"
              class="mb-4"
              reset-value=""
              :label-no-date-selected="$t('contributionLink.noDateSelected')"
              required
            ></b-form-datepicker>
          </b-form-group>
        </b-col>
        <b-col>
          <b-form-group :label="$t('contributionLink.endDate')">
            <b-form-datepicker
              v-model="form.endDate"
              size="lg"
              :min="form.startDate ? form.startDate : min"
              class="mb-4"
              reset-value=""
              :label-no-date-selected="$t('contributionLink.noDateSelected')"
              required
            ></b-form-datepicker>
          </b-form-group>
        </b-col>
      </b-row>

      <!-- Name -->
      <b-form-group :label="$t('contributionLink.name')">
        <b-form-input
          v-model="form.name"
          size="lg"
          type="text"
          placeholder="Name"
          required
        ></b-form-input>
      </b-form-group>
      <!-- Desc -->
      <b-form-group :label="$t('contributionLink.memo')">
        <b-form-textarea
          v-model="form.memo"
          size="lg"
          :placeholder="$t('contributionLink.memo')"
          required
        ></b-form-textarea>
      </b-form-group>
      <!-- Amount -->
      <b-form-group :label="$t('contributionLink.amount')">
        <b-form-input
          v-model="form.amount"
          size="lg"
          type="number"
          placeholder="0"
          required
        ></b-form-input>
      </b-form-group>

      <b-jumbotron>
        <b-row class="mb-4">
          <b-col>
            <!-- Cycle -->
            <label for="cycle-repetition">{{ $t('contributionLink.cycle') }}</label>
            <b-form-select
              v-model="form.cycle"
              :options="cycle"
              class="mb-3"
              size="lg"
            ></b-form-select>
          </b-col>
          <b-col>
            <!-- Repetition -->
            <label for="cycle-repetition">{{ $t('contributionLink.repetition') }}</label>
            <b-form-select
              v-model="form.repetition"
              :options="repetition"
              class="mb-3"
              size="lg"
            ></b-form-select>
          </b-col>
        </b-row>

        <!-- Max amount -->
        <b-form-group :label="$t('contributionLink.maximumAmount')">
          <b-form-input
            v-model="form.maxAmount"
            size="lg"
            type="number"
            placeholder="0"
          ></b-form-input>
        </b-form-group>
      </b-jumbotron>
      <div class="mt-6">
        <b-button type="submit" variant="primary">{{ $t('contributionLink.create') }}</b-button>
        <b-button type="reset" variant="danger" @click.prevent="onReset">
          {{ $t('contributionLink.clear') }}
        </b-button>
      </div>
    </b-form>
  </div>
</template>
<script>
import { createContributionLink } from '@/graphql/createContributionLink.js'
export default {
  name: 'ContributionLinkForm',
  props: {
    contributionLinkData: {
      type: Object,
      default() {
        return {}
      },
    },
  },
  data() {
    return {
      form: {
        name: null,
        memo: null,
        amount: null,
        startDate: null,
        endDate: null,
        cycle: null,
        repetition: null,
        maxAmount: null,
      },
      min: new Date(),
      cycle: [
        { value: null, text: this.$t('contributionLink.options.cycle.null') },
        { value: 'none', text: this.$t('contributionLink.options.cycle.none') },
        { value: 'hourly', text: this.$t('contributionLink.options.cycle.hourly') },
        { value: 'daily', text: this.$t('contributionLink.options.cycle.daily') },
        { value: 'weekly', text: this.$t('contributionLink.options.cycle.weekly') },
        { value: 'monthly', text: this.$t('contributionLink.options.cycle.monthly') },
        { value: 'yearly', text: this.$t('contributionLink.options.cycle.yearly') },
      ],
      repetition: [
        { value: null, text: 'Please select an repetition' },
        { value: '1', text: '1 x' },
        { value: '2', text: '2 x' },
        { value: '3', text: '3 x' },
        { value: '4', text: '4 x' },
        { value: '5', text: '5 x' },
      ],
    }
  },
  methods: {
    onSubmit() {
      if (this.form.startDate === null)
        return this.toastError(this.$t('contributionLink.noStartDate'))
      if (this.form.endDate === null) return this.toastError(this.$t('contributionLink.noEndDate'))
      alert(JSON.stringify(this.form))
      this.$apollo
        .mutate({
          mutation: createContributionLink,
          variables: {
            startDate: this.form.startDate,
            endDate: this.form.endDate,
            name: this.form.name,
            amount: this.form.amount,
            memo: this.form.memo,
            cycle: this.form.cycle,
            repetition: this.form.repetition,
            maxAmount: this.form.maxAmount,
          },
        })
        .then((result) => {
          this.link = result.data.createContributionLink.link
          this.toastSuccess(this.link)
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    onReset() {
      this.$refs.contributionLinkForm.reset()
      this.form.startDate = null
      this.form.endDate = null
    },
    updateForm() {
      alert('updateForm')
    },
  },
  computed: {
    updateData() {
      return this.contributionLinkData
    },
  },
  watch: {
    contributionLinkData() {
      this.form.name = this.contributionLinkData.name
      this.form.memo = this.contributionLinkData.memo
      this.form.amount = this.contributionLinkData.amount
      this.form.startDate = this.contributionLinkData.startDate
      this.form.endDate = this.contributionLinkData.endDate
      this.form.cycle = this.contributionLinkData.cycle
      this.form.repetition = this.contributionLinkData.repetition
      this.form.maxAmount = this.contributionLinkData.maxAmount
    },
  },
}
</script>
