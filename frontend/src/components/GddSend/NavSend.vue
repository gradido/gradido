<template>
  <div class="nav-send">
    <div
      class="nav-send-btn-wrapper bg-209 rounded-26 d-flex bd-highlight mx-xl-6 mx-lg-5 shadow justify-content-between"
    >
      <BButton
        :to="{ path: routeToTab(transactionForm) }"
        :class="stateClasses(SEND_TYPES.send)"
        block
        variant="link"
        class="nav-send__btn"
      >
        <b-img src="/img/svg/gdd_coin_sw.svg" height="20" class="svg-icon" />
        {{ $t('send_gdd') }}
      </BButton>
      <BButton
        :to="{ path: routeToTab(transactionConfirmationLink) }"
        :class="stateClasses(SEND_TYPES.link)"
        block
        variant="link"
        class="nav-send__btn"
      >
        <i-mdi-link-variant height="20" class="svg-icon" />
        {{ $t('send_per_link') }}
      </BButton>
      <BButton
        :to="{ path: routeToTab(sendEmailForm) }"
        :class="stateClasses(SEND_TYPES.email)"
        block
        variant="link"
        class="nav-send__btn"
      >
        <i-mdi-email-fast-outline height="20" class="svg-icon" />
        {{ $t('send_email') }}
      </BButton>
    </div>
  </div>
</template>
<script>
import { SEND_TYPES } from '@/utils/sendTypes'
import { BButton } from 'bootstrap-vue-next'

export default {
  name: 'NavSend',

  props: {
    selected: {
      type: String,
      default: '',
    },
    transactionForm: {
      type: String,
      default: '',
    },
    transactionConfirmationLink: {
      type: String,
      default: '',
    },
    sendEmailForm: {
      type: String,
      default: '',
    },
    routeBase: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      SEND_TYPES, // Expose the import to the template
    }
  },

  methods: {
    stateClasses(sendType) {
      if (this.selected === sendType) {
        return 'router-link-active router-link-exact-active'
      }
      return ''
    },
    routeToTab(route) {
      return '/send/' + route // this.routeBase + route
    },
  },
}
</script>
<style scoped lang="scss">
.nav-send-btn-wrapper {
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
