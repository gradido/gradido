<template>
  <div class="nav-community">
    <b-row class="nav-row">
      <b-col cols="12" md="4" lg="4" class="mb-2 mb-md-0 mb-lg-0">
        <b-btn active-class="btn-active" variant="link" block to="#edit">
          <b-icon icon="pencil" class="mr-2" />
          {{ $t('community.submitContribution') }}
        </b-btn>
      </b-col>
      <b-col cols="12" md="4" lg="4" class="text-center mb-2 mb-md-0 mb-lg-0">
        <b-btn active-class="btn-active" variant="link" block to="#my">
          <b-icon icon="person" class="mr-2" />
          {{ $t('community.myContributions') }}
        </b-btn>
      </b-col>
      <b-col cols="12" md="4" lg="4" class="text-right">
        <b-btn active-class="btn-active" variant="link" block to="#all">
          <b-icon icon="people" class="mr-2" />
          {{ $t('community.community') }}
        </b-btn>
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
  padding: 2px;
  border-radius: 26px;
}

.btn-active {
  background-color: rgb(23 141 129);
  color: white;
}
</style>
