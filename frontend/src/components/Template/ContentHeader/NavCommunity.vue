<template>
  <div class="nav-community container">
    <b-row class="mx-xl-6 mx-lg-5" align-v="stretch">
      <b-col class="px-0">
        <b-btn to="contribute" active-class="btn-active" block variant="link" class="rounded-right">
          <b-icon icon="pencil" class="mr-2 d-none d-md-inline" />
          {{ $t('community.submitContribution') }}
        </b-btn>
      </b-col>
      <b-col class="px-0">
        <b-btn to="contributions" active-class="btn-active" block variant="link" class="rounded-0">
          <b-icon icon="person" class="mr-2 d-none d-md-inline" />
          {{ $t('community.myContributions') }}
        </b-btn>
      </b-col>
      <b-col class="px-0">
        <b-btn to="community" active-class="btn-active" block variant="link" class="rounded-left">
          <b-icon icon="people" class="mr-2 d-none d-md-inline" />
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
.btn {
  background-color: rgb(209, 209, 209);
  color: black;
  padding-right: 0px;
  padding-left: 0px;
}
.btn-active {
  background-color: rgb(23 141 129);
  color: white;
}
</style>
