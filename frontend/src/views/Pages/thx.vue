<template>
  <div>
    <!-- Header -->
    <div class="header py-7 py-lg-8 pt-lg-9">
      <b-container>
        <div class="header-body text-center mb-7">
          <p class="h1">{{ $t(displaySetup.headline) }}</p>
          <p class="h4">{{ $t(displaySetup.subtitle) }}</p>
          <hr />
          <b-button v-if="displaySetup.linkTo" :to="displaySetup.linkTo">
            {{ $t(displaySetup.button) }}
          </b-button>
        </div>
      </b-container>
    </div>
    <!-- Page content -->
  </div>
</template>
<script>
const textFields = {
  password: {
    headline: 'site.thx.title',
    subtitle: 'site.thx.email',
    button: 'login',
    linkTo: '/login',
  },
  reset: {
    headline: 'site.thx.title',
    subtitle: 'site.thx.reset',
    button: 'login',
    linkTo: '/login',
  },
  register: {
    headline: 'site.thx.title',
    subtitle: 'site.thx.register',
    button: 'site.login.signin',
    linkTo: '/overview',
  },
  checkEmail: {
    headline: 'site.thx.title',
    subtitle: 'site.thx.checkEmail',
    button: 'login',
    linkTo: '/login',
  },
  login: {
    headline: 'site.thx.errorTitle',
    subtitle: 'site.thx.activateEmail',
    button: 'Send Activation Link',
  },
}

export default {
  name: 'Thx',
  data() {
    return {
      displaySetup: {},
    }
  },
  methods: {
    setDisplaySetup(from) {
      this.displaySetup = textFields[this.$route.params.comingFrom]
    },
  },
  created() {
    this.setDisplaySetup()
  },
}
</script>
