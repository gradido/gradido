<template>
  <div>
    <div
      class="header pb-8 pt-5 pt-lg-8 d-flex align-items-center profile-header"
      style="max-height:200px"
    ></div>
    <b-container fluid class="mt--6">
      <b-row>
        <b-col class="order-xl-1">
          <gdd-table></gdd-table>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import GddTable from "../../views/KontoOverview/GddTable.vue";

export default {
  components: {
    GddTable
  }
};
</script>
<style></style>
