<template>
  <div class="open-creations-amount bg-white appBoxShadow gradido-border-radius p-4">
    <div class="my-3">
      <ul class="my-3">
        <li v-html="textForMonth(new Date(minimalDate), maxGddLastMonth)"></li>
        <li v-html="textForMonth(new Date(), maxGddThisMonth)"></li>
      </ul>
    </div>
  </div>
</template>
<script>
export default {
  name: 'OpenCreationsAmount',
  props: {
    minimalDate: { type: Date, required: true },
    maxGddLastMonth: { type: Number, required: true },
    maxGddThisMonth: { type: Number, required: true },
  },

  methods: {
    textForMonth(date, availableAmount) {
      const obj = {
        monthAndYear: this.$d(date, 'monthAndYear'),
        creation: availableAmount,
      }
      return this.$t('contribution.formText.openAmountForMonth', obj)
    },
  },
}
</script>
