<template>
  <div class="nav-community">
    <div class="bg-209 rounded-26 d-flex bd-highlight mx-xl-6 mx-lg-5 shadow">
      <b-btn to="contribute" active-class="btn-active svg-icon-active" block variant="link">
        <b-img src="/img/svg/write.svg" height="20" class="svg-icon" />
        {{ $t('community.submitContribution') }}
      </b-btn>
      <b-btn to="contributions" active-class="btn-active svg-icon-active" block variant="link">
        <b-img src="/img/svg/my_profil.svg" height="20" class="svg-icon" />
        {{ $t('community.myContributions') }}
      </b-btn>
      <b-btn to="community" active-class="btn-active svg-icon-active" block variant="link">
        <b-img src="/img/svg/community.svg" height="20" class="svg-icon" />
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

.svg-icon {
  filter: brightness(0) invert(0);
}
.btn-active {
  background-color: rgb(23 141 129);
  color: white;
  font-weight: bold;
}
.btn-active .svg-icon {
  filter: brightness(0) invert(1);
}
</style>
