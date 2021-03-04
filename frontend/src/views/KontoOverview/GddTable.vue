<template>
  <div>
  
        <b-list-group > 
          <b-list-group-item v-for="item in items" :key="item.id"> 
          <div class="d-flex w-100 justify-content-between"  @click="toogle(item)" >
            <b-icon v-if="item.type === 'send'" icon="box-arrow-left"   class="m-1"  font-scale="2" style="color:red"></b-icon>
            <b-icon v-else icon="box-arrow-right" class="m-1"  font-scale="2" style="color:green" ></b-icon>       
              <h1 class="mb-1">{{ $n((item.balance)/1000) }} <small>GDD</small></h1>
              <h2 class="text-muted">{{item.name}}</h2>
                <b-button v-b-toggle="'a'+item.transaction_id" variant="primary"><b>i</b></b-button>
            </div>
             <b-collapse :id="'a'+item.transaction_id" class="mt-2">
              <b-card>
                <p class="card-text">{{item}}</p>
                <b-button v-b-toggle="'collapse-1-inner'+ item.transaction_id" size="sm">\i/ more</b-button>
                <b-collapse :id="'collapse-1-inner'+ item.transaction_id" class="mt-2">
                  <b-card>{{item}}</b-card>
                </b-collapse>
              </b-card>
            </b-collapse>
          </b-list-group-item>
           <b-list-group-item>
                <b-alert v-if="count < 5" show variant="secondary">
                  Die letzten <strong>{{count}}</strong> Transaktionen
                </b-alert>
              <router-link to="/activity"  > mehr (+ {{count}})</router-link>  
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
        items: [],
        count: 0
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
     console.log("result.transactions",result.data.transactions)
     //commit('transactions', result.data.transactions)
      this.$store.state.user.balance_gdt =  result.data.gdtSum
      this.items = result.data.transactions
      this.count = result.data.count
     
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

      }
  } 
};
</script>
<style>
.el-table .cell{
  padding-left: 0px;
  padding-right: 0px;
}
</style>