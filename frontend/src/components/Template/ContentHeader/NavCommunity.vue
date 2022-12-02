<template>
  <div class="nav-community">
    <b-row class="nav-row">
      <b-col>
        <router-link to="#edit">{{ $t('community.submitContribution') }}</router-link>
      </b-col>
      <b-col class="text-center">
        <router-link to="#my">{{ $t('community.myContributions') }}</router-link>
      </b-col>
      <b-col class="text-right">
        <router-link to="#all">{{ $t('community.community') }}</router-link>
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

.router-link-exact-active {
  background-color: rgb(14, 121, 188);
  color: white;
  border-radius: 26px;
  padding: 10px;
  padding-left: 25px;
  padding-right: 25px;
}
</style>
