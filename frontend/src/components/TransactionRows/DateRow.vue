<template>
  <div class="date-row">
    <BRow>
      <BCol cols="5">
        <div class="text-right">
          {{ text }}
        </div>
      </BCol>
      <BCol cols="7">
        <div class="gdd-transaction-list-item-date">
          {{ $d(new Date(this.date), 'long') }}
        </div>
      </BCol>
    </BRow>
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
