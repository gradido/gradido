<template>
  <div class="contribution-link-form">
    <b-form class="m-5" @submit.prevent="onSubmit" ref="contributionLinkForm">
      <!-- Date -->
      <b-row>
        <b-col>
          <b-form-group :label="$t('contributionLink.validFrom')">
            <b-form-datepicker
              v-model="form.validFrom"
              size="lg"
              :min="min"
              class="mb-4 test-validFrom"
              reset-value=""
              :label-no-date-selected="$t('contributionLink.noDateSelected')"
              required
            ></b-form-datepicker>
          </b-form-group>
        </b-col>
        <b-col>
          <b-form-group :label="$t('contributionLink.validTo')">
            <b-form-datepicker
              v-model="form.validTo"
              size="lg"
              :min="form.validFrom ? form.validFrom : min"
              class="mb-4 test-validTo"
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
          maxlength="100"
          class="test-name"
        ></b-form-input>
      </b-form-group>
      <!-- Desc -->
      <b-form-group :label="$t('contributionLink.memo')">
        <b-form-textarea
          v-model="form.memo"
          size="lg"
          :placeholder="$t('contributionLink.memo')"
          required
          maxlength="255"
          class="test-memo"
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
          class="test-amount"
        ></b-form-input>
      </b-form-group>
      <b-row class="mb-4">
        <b-col>
          <!-- Cycle -->
          <label for="cycle">{{ $t('contributionLink.cycle') }}</label>
          <b-form-select
            v-model="form.cycle"
            :options="cycle"
            class="mb-3"
            size="lg"
          ></b-form-select>
        </b-col>
        <b-col>
          <!-- maxPerCycle -->
          <label for="maxPerCycle">{{ $t('contributionLink.maxPerCycle') }}</label>
          <b-form-select
            v-model="form.maxPerCycle"
            :options="maxPerCycle"
            :disabled="disabled"
            class="mb-3"
            size="lg"
          ></b-form-select>
        </b-col>
      </b-row>

      <!-- Max amount -->
      <!-- 
          <b-form-group :label="$t('contributionLink.maximumAmount')">
            <b-form-input
              v-model="form.maxAmountPerMonth"
              size="lg"
              :disabled="disabled"
              type="number"
              placeholder="0"
            ></b-form-input>
          </b-form-group>
          -->
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
        validFrom: null,
        validTo: null,
        cycle: 'ONCE',
        maxPerCycle: 1,
        maxAmountPerMonth: '0',
      },
      min: new Date(),
      cycle: [
        { value: 'ONCE', text: this.$t('contributionLink.options.cycle.once') },
        //        { value: 'hourly', text: this.$t('contributionLink.options.cycle.hourly') },
        { value: 'DAILY', text: this.$t('contributionLink.options.cycle.daily') },
        //        { value: 'weekly', text: this.$t('contributionLink.options.cycle.weekly') },
        //        { value: 'monthly', text: this.$t('contributionLink.options.cycle.monthly') },
        //        { value: 'yearly', text: this.$t('contributionLink.options.cycle.yearly') },
      ],
      maxPerCycle: [
        { value: '1', text: '1 x' },
        //        { value: '2', text: '2 x' },
        //        { value: '3', text: '3 x' },
        //        { value: '4', text: '4 x' },
        //        { value: '5', text: '5 x' },
      ],
    }
  },
  methods: {
    onSubmit() {
      if (this.form.validFrom === null)
        return this.toastError(this.$t('contributionLink.noStartDate'))
      if (this.form.validTo === null) return this.toastError(this.$t('contributionLink.noEndDate'))
      this.$apollo
        .mutate({
          mutation: createContributionLink,
          variables: {
            validFrom: this.form.validFrom,
            validTo: this.form.validTo,
            name: this.form.name,
            amount: this.form.amount,
            memo: this.form.memo,
            cycle: this.form.cycle,
            maxPerCycle: this.form.maxPerCycle,
            maxAmountPerMonth: this.form.maxAmountPerMonth,
          },
        })
        .then((result) => {
          this.link = result.data.createContributionLink.link
          this.toastSuccess(this.link)
          this.onReset()
          this.$root.$emit('bv::toggle::collapse', 'newContribution')
          this.$emit('get-contribution-links')
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    onReset() {
      this.$refs.contributionLinkForm.reset()
      this.form.validFrom = null
      this.form.validTo = null
    },
  },
  computed: {
    updateData() {
      return this.contributionLinkData
    },
    disabled() {
      return true
    },
  },
  watch: {
    contributionLinkData() {
      this.form.name = this.contributionLinkData.name
      this.form.memo = this.contributionLinkData.memo
      this.form.amount = this.contributionLinkData.amount
      this.form.validFrom = this.contributionLinkData.validFrom
      this.form.validTo = this.contributionLinkData.validTo
      this.form.cycle = this.contributionLinkData.cycle
      this.form.maxPerCycle = this.contributionLinkData.maxPerCycle
      this.form.maxAmountPerMonth = this.contributionLinkData.maxAmountPerMonth
    },
  },
}
</script>
