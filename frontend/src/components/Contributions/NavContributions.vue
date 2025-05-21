<template>
  <div class="nav-contributions">
    <div
      class="nav-contributions-btn-wrapper bg-209 rounded-26 d-flex bd-highlight mx-xl-6 mx-lg-5 shadow justify-content-between"
    >
      <BButton
        :to="{ path: routeToTab(contribute) }"
        :class="stateClasses(contribute)"
        block
        variant="link"
        class="nav-contributions__btn"
      >
        <b-img src="/img/svg/write.svg" height="20" class="svg-icon" />
        {{ $t('community.submitContribution') }}
      </BButton>
      <BButton
        :to="{ path: routeToTab(ownContributions) }"
        :class="stateClasses(ownContributions)"
        block
        variant="link"
        class="nav-contributions__btn"
      >
        <i-ion-person-sharp class="svg-icon" />
        {{ $t('community.myContributions') }}
      </BButton>
      <BButton
        :to="{ path: routeToTab(allContributions) }"
        :class="stateClasses(allContributions)"
        block
        variant="link"
        class="nav-contributions__btn"
      >
        <i-mdi-people-group class="svg-icon" />
        {{ $t('community.community') }}
      </BButton>
    </div>
  </div>
</template>
<script>
export default {
  name: 'NavContributions',

  props: {
    allContributions: {
      type: String,
      default: '',
    },
    contribute: {
      type: String,
      default: '',
    },
    ownContributions: {
      type: String,
      default: '',
    },
    routeBase: {
      type: String,
      default: '',
    },
  },

  methods: {
    stateClasses(route) {
      if (this.$route.path.includes(route)) {
        return 'router-link-active router-link-exact-active'
      }
      return ''
    },
    routeToTab(route) {
      return this.routeBase + route
    },
  },
}
</script>
<style scoped lang="scss">
.nav-contributions-btn-wrapper {
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
