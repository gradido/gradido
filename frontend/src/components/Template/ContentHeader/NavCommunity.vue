<template>
  <div class="nav-community">
    <div class="bg-209 rounded-26 d-flex bd-highlight mx-xl-6 mx-lg-5 shadow">
      <b-btn to="contribute" active-class="btn-active appBoxShadow" block variant="link">
        <b-icon icon="pencil" class="mr-1 mr-md-2" />
        {{ $t('community.submitContribution') }}
      </b-btn>
      <b-btn to="contributions" active-class="btn-active appBoxShadow" block variant="link">
        <b-icon icon="person" class="mr-1 mr-md-2" />
        {{ $t('community.myContributions') }}
      </b-btn>
      <b-btn to="community" active-class="btn-active appBoxShadow" block variant="link">
        <b-icon icon="people" class="mr-1 mr-md-2" />
        {{ $t('community.community') }}
      </b-btn>
    </div>
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
.btn-block + .btn-block {
  margin-top: 0rem;
}
.btn-active {
  background-color: rgb(23 141 129);
  color: white;
}
</style>
