<template>
  <div>
    <div class="header pb-8 pt-5 pt-lg-8 d-flex align-items-center profile-header" style="max-height:200px">
            <b-container fluid>
        <!-- Mask -->
        <span class="mask bg-gradient-success opacity-8"></span>
        <!-- Header container -->
        <b-container fluid class="d-flex align-items-center">
          <b-row >
            <b-col lg="7" md="10">
              <h1 class="display-2 text-white">{{this.$store.state.email}} </h1>
               
           
            </b-col>
          </b-row>
        </b-container>
      </b-container>
    </div>

    <b-container fluid class="mt--6">
      <b-row>
        <b-col xl="4" class="order-xl-2 mb-5">
          community
         <gdd-work-table></gdd-work-table>
        </b-col>
        <b-col xl="8" class="order-xl-1">
          transactions
          <gdd-table></gdd-table>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
  import GddTable from '../../views/KontoOverview/GddTable.vue';
  import GddWorkTable from '../../views/KontoOverview/GddWorkTable.vue';
   

  export default {
    components: {
      GddTable,
     GddWorkTable
    }
  };
</script>
<style>
</style>
