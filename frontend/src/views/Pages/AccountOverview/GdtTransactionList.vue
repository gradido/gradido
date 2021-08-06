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
        } in transactionsGdt[0].gdt"
        :key="id"
      >

      <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1">List group item heading</h5>
      <small>{{ $d($moment(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}</small>
    </div>

    <p class="mb-1">
      Donec id elit non mi porta gravida at eget metus. Maecenas sed diam eget risus varius blandit.
    </p>

    <small>Donec id elit non mi porta.</small>
    
        
        <div>{{ id }} {{ amount }} {{ date }}  {{ email }} {{ comment }}  {{ coupon_code }} 
         {{ gdt_entry_type_id }} {{ factor }}  {{ amount2 }} {{ factor2 }} 
         {{ gdt }}</div>

         <div>{{gdt_entry_type_id === 7 ? 'GDT in Euro gekauft' : 'GDT von gradido bekommen'}}</div>
      </b-list-group-item>
    </b-list-group>


   <hr>
   <div>
     {{transactionsGdt[0].state}}
   </div>
   <div>
     {{transactionsGdt[0].gdt}}
   </div>
 
   <hr>
   <div>
     {{transactionsGdt[0]}}
   </div>
    
 
  </div>
</template>

<script>
export default {
  name: 'gdt-transaction-list',
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
