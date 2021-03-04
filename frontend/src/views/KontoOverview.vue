<template>
  <div>
    <base-header class="pb-6 pb-8 pt-5 pt-md-8 bg-gradient-success">
      <gdd-status />        
      <br>
      <gdd-sent />
      <hr>
      <gdd-table />
      <!--  
      <hr>
      <div>
        <gdd-add-work />       
      </div>
      <br>
      -->
      <!-- 
      <div>
        <gdd-work-table />       
      </div>
      -->
    </base-header>     
     <hr>
  </div>
</template>
<script>
   import GddStatus from './KontoOverview/GddStatus.vue';
   import GddSent from './KontoOverview/GddSent.vue';
   import GddTable from './KontoOverview/GddTable.vue';
   // import GddAddWork from './KontoOverview/GddAddWork.vue';
   // import GddWorkTable from './KontoOverview/GddWorkTable.vue';

  export default {  
    name: "Overview",
    components: {
        GddStatus,
        GddSent,
        GddTable
        //GddAddWork
        //GddWorkTable
     },
     created() { 
       this.$store.dispatch('accountBalance')        
     },
  };
</script>




 