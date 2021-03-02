<template>
  <div>
  
        <b-table striped hover :items="items" :fields="fields" :tbody-tr-class="rowClass" responsive="true" >
          <template  #cell(status)="row">   
            <img  v-if="row.item.type === 'send' " src="img/icons/gradido/minus.png" width="50" />          
            <img  v-else src="img/icons/gradido/plus-low.png" width="50" />            
          </template>
          <template #cell(details)="row">
            <b-button size="md" @click="row.toggleDetails" class="mr-2">
              {{ row.detailsShowing ? $t('site.overview.table.hide')  : $t('site.overview.table.view') }}
            </b-button>        
          </template>

          <!-- Table details  -->
          <template #row-details="row">
            <b-card>
              <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>{{ $t('site.overview.table.amount') }}:</b></b-col>
                <b-col>{{ row.item.balance }} GDD</b-col>
              </b-row>
              <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>{{ $t('site.overview.table.decay') }}: </b></b-col>
                <b-col>{{ row.item.memo }} </b-col>
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
    
        <hr>

        <b-list-group > 
          <b-list-group-item v-for="item in items" :key="item.id"> 
          <div class="d-flex w-100 justify-content-between"  @click="toogle(item)" >
            <b-icon v-if="item.type === 'send'" icon="box-arrow-left"   class="m-1"  font-scale="2" style="color:red"></b-icon>
            <b-icon v-else icon="box-arrow-right" class="m-1"  font-scale="2" style="color:green" ></b-icon>       
              <h1 class="mb-1">{{ setComma(item.balance) }} <small>GDD</small></h1>
              <h2 class="text-muted"><small>{{item.date}}</small> - {{item.name}}</h2>
            </div>
          </b-list-group-item>
        </b-list-group>

  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'GddTable',  
  data(){
    return {
        form: [],
        fields: [ 'balance', 'date', 'memo', 'name', 'transaction_id', 'type','details'],       
        items: []
    };
  },
    
    created() {
     
     axios.get("http://localhost/state-balances/ajaxListTransactions/"+ this.$store.state.session_id).then((result) => {
      //console.log("result",result)
      //console.log("result.state",result.data.state)
     //
      //console.log("result.data.state == 'success'",result.data.state == "success")
   
    //console.log("result.count",result.data.count)
    // console.log("result.gdtSum",result.data.gdtSum)
    // console.log("result.transactions",result.data.transactions)
     //commit('transactions', result.data.transactions)
      this.$store.state.user.balance_gdt =  result.data.gdtSum
      this.items = result.data.transactions
     
   }, (error) => {
     console.log(error);
   });
 
    
   },
  
  methods: {
     rowClass(item, type) {
        if (!item || type !== 'row') return
        if (item.type === 'receive') return 'table-success'
        if (item.type === 'send') return 'table-warning'
        if (item.type === 'creation') return 'table-primary'
      },
      toogle(item) {
        const temp = '<b-collapse visible v-bind:id="item.id">xxx <small class="text-muted">porta</small></b-collapse>'

      },
      setComma(int){
        return int / 10000

      }
  },

 
};
</script>
<style>
.el-table .cell{
  padding-left: 0px;
  padding-right: 0px;
}
</style>