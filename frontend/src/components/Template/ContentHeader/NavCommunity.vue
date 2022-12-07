<template>
  <div class="nav-community">
    <b-row class="nav-row">
      <b-col cols="12" md="4" lg="4" class="mb-2 mb-md-0 mb-lg-0">
        <b-button block to="#edit">{{ $t('community.submitContribution') }}</b-button>
      </b-col>
      <b-col cols="12" md="4" lg="4" class="text-center mb-2 mb-md-0 mb-lg-0">
        <b-button block to="#my">{{ $t('community.myContributions') }}</b-button>
      </b-col>
      <b-col cols="12" md="4" lg="4" class="text-right">
        <b-button block to="#all">{{ $t('community.community') }}</b-button>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'NavCommunity',
}
</script>
<style scoped>
.nav-row {
  background-color: rgb(209, 209, 209);
  padding: 10px;
  border-radius: 26px;
}

/* .router-link-exact-active {
  background-color: rgb(14, 121, 188);
  color: white;
  border-radius: 26px;
  padding: 10px;
  padding-left: 25px;
  padding-right: 25px;
} */
</style>
