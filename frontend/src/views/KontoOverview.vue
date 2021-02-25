<template>
  <div>
    <base-header class="pb-6 pb-8 pt-5 pt-md-8 bg-gradient-success">
      <!-- Card stats GDD User Status -->
      <gdd-status />
        
      <br>
      
      <!-- Card sent GDD-->
      <gdd-sent />
      <br>
      <br>
      <!-- Card table -->
      <div>
        <gdd-table />
       
      </div>
      <br>
      <br>
      <!-- Card table -->
      <div>
        <gdd-add-work />
       
      </div>
 <br>
      <br>
      <!-- Card table -->
      <div>
        <gdd-work-table />
       
      </div>
    </base-header>
    <div @click="$store.commit('accountBalance0')">this.$store.commit('accountBalance0')</div>
    <div @click="$store.commit('accountBalance')">this.$store.commit('accountBalance')</div> 
     <hr>
    <h3>User Balanace</h3>
    <small>this.$store.state.user.balance</small>
    <p>
       {{this.$store.state.user}}
    </p>
     <hr>
    <h3>User Balanace</h3>
    <small>this.$store.state.user.balance</small>
    <p>
      {{this.$store.state.user.balance}}
    </p>

 <hr>
    <h3>User Transactions List</h3>
    <small>/public/json-example/usertransactions.json</small>
    <p>
      {{usertransactions}}
    </p>


 <hr>
    <h3>User Participation List</h3>
    <small>/public/json-example/userparticipation.json</small>
    <p>
      {{userparticipation}}
    </p>

    
  </div>  
</template>

<script>

   import GddStatus from './KontoOverview/GddStatus.vue';
   import GddSent from './KontoOverview/GddSent.vue';
   import GddTable from './KontoOverview/GddTable.vue';
   import GddAddWork from './KontoOverview/GddAddWork.vue';
   import GddWorkTable from './KontoOverview/GddWorkTable.vue';
   import axios from 'axios';

  export default {
    data(){
      return {
        usertransactions: {},
        userdata: {},
        userparticipation: {}
      }
    },
    components: {
        GddStatus,
        GddSent,
        GddTable,
        GddAddWork,
        GddWorkTable,
        axios
     },
     created() {
        
     },
     methods: {
         UserData() {
          axios.get("/json-example/userdata.json").then((d) => {
          console.log(d);
          this.userdata = d.data;
          
        }, (error) => {
          console.log(error);
        });
        },
        UserTransactions() {
          axios.get("/json-example/usertransactions.json").then((transactions) => {
          console.log(transactions);
          this.usertransactions = transactions.data;
          
        }, (error) => {
          console.log(error);
        });
        },
        UserParticitions() {
          axios.get("/json-example/userparticipation.json").then((participation) => {
          console.log(participation);
          this.userparticipation = participation.data;
          
        }, (error) => {
          console.log(error);
        });
        }
     },
        created() {
        // Simple GET request using axios
        // axios.get("https://api.npms.io/v2/search?q=vue").then((response) => {
        //   console.log(response);
        //   this.totalVuePackages = response.data.total;
        //   this.dataVuePackages = response.data;
        // }, (error) => {
        //   console.log(error);
        // });
        /////////////////////////
      },
      mounted() {
        this.UserData();
        this.UserTransactions();
        this.UserParticitions();
      },
  };
</script>




 