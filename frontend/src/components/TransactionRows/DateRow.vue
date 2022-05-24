<template>
  <div class="date-row">
    <b-row>
      <b-col cols="5">
        <div class="text-right">
          {{ text }}
        </div>
      </b-col>
      <b-col cols="7">
        <div class="gdd-transaction-list-item-date">
          {{ $d(new Date(this.date), 'long') }}
        </div>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'DateRow',
  props: {
    date: {
      type: String,
      required: true,
    },
    diffNow: {
      type: Boolean,
      required: false,
      default: false,
    },
    validLink: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  computed: {
    text() {
      if (this.diffNow)
        return this.validLink
          ? this.$t('gdd_per_link.validUntil')
          : this.$t('gdd_per_link.expiredOn')
      return this.$t('form.date')
    },
  },
}
</script>
