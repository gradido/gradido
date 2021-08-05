<template>
  <div class="gdd-transaction-gtd-list">
    <hr />
    {{ transactionsGdt[0].gdt }}
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
        } in transactionsGdt[0].gdt"
        :key="id"
      >
        <div>id: {{ id }}</div>
        <div>amount: {{ amount }}</div>
        <div>date: {{ date }}</div>
        <div>email: {{ email }}</div>
        <div>comment: {{ comment }}</div>
        <div>coupon_code: {{ coupon_code }}</div>
        <div>gdt_entry_type_id: {{ gdt_entry_type_id }}</div>
        <div>factor: {{ factor }}</div>
        <div>amount2: {{ amount2 }}</div>
        <div>factor2: {{ factor2 }}</div>
        <div>gdt: {{ gdt }}</div>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
export default {
  name: 'gdd-transaction-gtd-list',
  props: {
    transactionsGdt: { default: () => [] },
  },
  methods: {
    updateGdt() {
      this.$emit('update-gdt')
    },
  },
}
</script>
<style>
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}
</style>
