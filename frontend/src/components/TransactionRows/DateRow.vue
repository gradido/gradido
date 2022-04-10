<template>
  <div class="date-row">
    <b-row>
      <b-col cols="5">
        <div class="text-right">
          {{ diffNow ? $t('gdd_per_link.valid_until') : $t('form.date') }}
        </div>
      </b-col>
      <b-col cols="7">
        <div class="gdd-transaction-list-item-date">
          {{ dateString }}
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
  },
  computed: {
    dateString() {
      return this.$d(new Date(this.date), 'long')
    },
  },
}
</script>
