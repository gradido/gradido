<template>
  <div>
    <base-header class="pb-6 pb-8 pt-5 pt-md-8 bg-gradient-success">
      <!-- Card stats GDD User Status -->
      <gdd-status />
        
      <br>
      
      <!-- Card sent GDD-->
      <gdd-sent />
      <hr>
      <!-- Card table -->
      <div>
        <gdd-table />
       
      </div>
     
      <!-- Card table 
      <hr>
      <div>
        <gdd-add-work />
       
      </div>
      <br>
      -->
      <!-- Card table 
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
   //import GddAddWork from './KontoOverview/GddAddWork.vue';
  // import GddWorkTable from './KontoOverview/GddWorkTable.vue';

  export default {  
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




 