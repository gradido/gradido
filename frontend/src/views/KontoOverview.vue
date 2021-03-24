<template>
  <div>
    <base-header class="pb-6 pb-8 pt-5 pt-md-8 bg-transparent"></base-header>
    <b-container fluid class="mt--7">
      <gdd-status />
      <br />
      <gdd-send />
      <hr />
      <gdd-table />
      <!-- <hr>
              <div>
                <gdd-add-work-2 />       
              </div>
              <br> -->
      <!--
                <div>
                  <gdd-add-work />       
                </div>
                <br>
              -->
      <!-- <div>
                <gdd-work-table />       
              </div>     -->
    </b-container>
  </div>
</template>
<script>
import GddStatus from "./KontoOverview/GddStatus.vue";
import GddSend from "./KontoOverview/GddSend.vue";
import GddTable from "./KontoOverview/GddTable.vue";
// import GddAddWork2  from './KontoOverview/GddAddWork2.vue';
// import GddWorkTable from './KontoOverview/GddWorkTable.vue';

export default {
  name: "Overview",
  components: {
    GddStatus,
    GddSend,
    GddTable
    //GddAddWork2,
    //GddWorkTable
  },
  created() {
    this.$store.dispatch("accountBalance", $cookies.get("gdd_session_id"));
  }
};
</script>

<style>
.active {
  background-color: rgba(192, 192, 192, 0.568);
}
</style>
