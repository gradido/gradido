<template>
  <div class="gdt-transaction-list">
    
    {{this.transactionsGdt[0].gdt}}

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
        } in this.transactionsGdt[0].gdt"
        :key="id"
      >
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">{{id}}: {{ email }}</h5>
          <small>{{  date  }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}</small>
        </div>

        
        
          {{ gdt_entry_type_id === 7 ? 'GDT in Euro gekauft' : 'GDT von gradido bekommen' }}
         
        <div v-if="gdt_entry_type_id === 7">
          {{amount  }} GDT ⊢ {{  (amount / factor)    }}€
        </div>
         <div v-else>
          {{amount  }} GDT 
        </div>
        <small>
          {{ id }} {{ amount }} {{ date }} {{ email }} {{ comment }} {{ coupon_code }}
          {{ gdt_entry_type_id }} {{ factor }} {{ amount2 }} {{ factor2 }} {{ gdt }}
        </small>

      </b-list-group-item>

    </b-list-group>

    <!--
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
    -->
  </div>
</template>

<script>

export default {
  name: 'gdt-transaction-list',
  props: {
    transactionsGdt: { default: () => [] },
    transactionGdtCount: { type: Number, default: 0 },
  },
  data() {
    return {
      gdt: []
    }
  },
  methods: {
    updateGdt() {
      this.$emit('update-gdt', {
        firstPage: this.currentPage,
        items: this.pageSize,
      })
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
