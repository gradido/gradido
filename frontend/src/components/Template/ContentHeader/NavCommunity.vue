<template>
  <div class="nav-community">
    <div
      class="nav-community-btn-wrapper bg-209 rounded-26 d-flex bd-highlight mx-xl-6 mx-lg-5 shadow justify-content-between"
    >
      <BButton
        to="contribute"
        active-class="btn-active svg-icon-active"
        block
        variant="link"
        class="nav-community__btn"
      >
        <b-img src="/img/svg/write.svg" height="20" class="svg-icon" />
        {{ $t('community.submitContribution') }}
      </BButton>
      <BButton
        to="contributions"
        active-class="btn-active svg-icon-active"
        block
        variant="link"
        class="nav-community__btn"
      >
        <i-ion-person-sharp class="svg-icon" />
        {{ $t('community.myContributions') }}
      </BButton>
      <BButton
        to="community"
        active-class="btn-active svg-icon-active"
        block
        variant="link"
        class="nav-community__btn"
      >
        <i-mdi-people-group class="svg-icon" />
        {{ $t('community.community') }}
      </BButton>
    </div>
  </div>
</template>
<script>
export default {
  name: 'NavCommunity',
}
</script>
<style scoped lang="scss">
.nav-community-btn-wrapper {
  background-color: #d1d1d1;

  > :deep(*) {
    width: calc(100% / 3);
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-size: 14px;
    text-wrap: nowrap;
    color: black !important;
    border-radius: 25px;
  }
}

:deep(.svg-icon) {
  filter: brightness(0) invert(0);
}

:deep(.router-link-active) {
  background-color: rgb(23 141 129);
  color: white !important;
  font-weight: bold;
  padding: 0.625rem 1.25rem;
  border-radius: 25px;
}

:deep(.router-link-active .svg-icon) {
  filter: brightness(0) invert(1);
}
</style>
