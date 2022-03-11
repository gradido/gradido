<template>
  <div class="transaction-rows-date">
    <b-row>
      <b-col cols="5">
        <div class="text-right">{{ $t('form.date') }}</div>
      </b-col>
      <b-col cols="7">
        <div class="gdd-transaction-list-item-date">
          {{ $d(new Date(balanceDate), 'long') }}
          {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
        </div>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'Transaction-Rows-Date',
  props: {
    balanceDate: {
      type: String,
      required: true,
    },
  },
}
</script>
