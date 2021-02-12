<template>
  <div>
           <b-table striped hover :items="items" :fields="fields" :tbody-tr-class="rowClass">
          <template  #cell(status)="row">   
            <img  v-if="row.item.status === 'sent' " src="img/icons/gradido/minus.png" width="50" />          
              <img  v-else src="img/icons/gradido/plus-low.png" width="50" /> 
               
             
          </template>
          <template #cell(details)="row">
            <b-button size="sm" @click="row.toggleDetails" class="mr-2">
              {{ row.detailsShowing ? $t('site.overview.table.hide')  : $t('site.overview.table.view') }}
            </b-button>        
          </template>

          <template #row-details="row">
            <b-card>
              <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>{{ $t('site.overview.table.amount') }}:</b></b-col>
                <b-col>{{ row.item.amount }} GDD</b-col>
              </b-row>

              <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>{{ $t('site.overview.table.decay') }}: </b></b-col>
                <b-col>{{ row.item.isActive }}0.0032 GDD</b-col>
              </b-row>
                <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>{{ $t('site.overview.table.sender') }}: </b></b-col>
                <b-col>{{ row.item.name }}</b-col>
                <b-col>{{ row.item.date }}</b-col>
              </b-row>

              <b-button size="sm" @click="row.toggleDetails">{{ $t('site.overview.table.hide_details') }}</b-button>
            </b-card>
          </template>
        </b-table>
  </div>
</template>

<script>


export default {
  name: 'GddTable',  
  data(){
    return {
        form: [],
        fields: [ 'status', 'betrag', 'name', 'datum', 'details'],
        items: [
          {  betrag: 1000, name: 'Dickerson', datum: '12.12.20', datel: '12.12.2020 14:04', status: 'received' },
          {  betrag: 302,  name: 'Larsen',    datum: '22.06.20', datel: '22.06.2020 22:23', status: 'sent'  },
          {  betrag: 89,   name: 'Geneva',    datum: '15.04.20', datel: '15.04.2020 12:55', status: 'sent' },
          {  betrag: 1000, name: 'Community', datum: '10.03.20', datel: '10.03.2020 18:20', status: 'received'}
        ]      
    };
  },
  methods: {
     rowClass(item, type) {
        if (!item || type !== 'row') return
        if (item.status === 'received') return 'table-success'
        if (item.status === 'sent') return 'table-warning'
        if (item.status === 'earned') return 'table-primary'
         
      },
  },
  watch: {
  }
};
</script>
<style>
.el-table .cell{
  padding-left: 0px;
  padding-right: 0px;
}
</style>