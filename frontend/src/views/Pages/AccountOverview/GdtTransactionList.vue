<template>
  <div class="gdt-transaction-list">
    <b-list-group>
      <b-list-group-item
        v-for="{
          id,
          amount,
          date,
          email,
          comment,
          coupon_code,
          gdt_entry_type_id,
          factor,
          amount2,
          factor2,
          gdt,
        } in this.transactionsGdt"
        :key="id"
      >
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">Gradido Transform (GDT) erhalten {{ comment ? ': ' + comment : '' }}</h5>
          <small>{{ $d($moment(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}</small>
        </div>

        <div v-if="gdt_entry_type_id === 7">{{ amount }} GDT * {{ factor }} = {{ gdt }}</div>
        <div v-else>{{ amount }} € ⊢ {{ gdt }} GDT</div>
        <small>
          {{ id }} {{ amount }} {{ date }} {{ email }} {{ comment }} {{ coupon_code }}
          {{ gdt_entry_type_id }} {{ factor }} {{ amount2 }} {{ factor2 }} {{ gdt }}
        </small>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
export default {
  name: 'gdt-transaction-list',
  props: {
    transactionsGdt: { default: () => [] },
    transactionGdtCount: { type: Number, default: 0 },
  },
}
</script>
<style>
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}
</style>
