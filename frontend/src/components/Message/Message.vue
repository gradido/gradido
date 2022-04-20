<template>
  <div>
    <!-- Header -->
    <div class="header py-7 py-lg-8 pt-lg-9">
      <b-container>
        <div class="header-body text-center mb-7">
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <p class="h1">{{ $t(displaySetup.headline) }}</p>
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <p class="h4">{{ $t(displaySetup.subtitle) }}</p>
          <hr />
          <b-button v-if="$route.params.code" :to="`/login/${$route.params.code}`">
            <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
            {{ $t(displaySetup.button) }}
          </b-button>
          <b-button v-else-if="displaySetup.linkTo" :to="displaySetup.linkTo">
            <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
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
  forgotPassword: {
    headline: 'site.thx.title',
    subtitle: 'site.thx.email',
    button: 'login',
    linkTo: '/login',
  },
  resetPassword: {
    headline: 'site.thx.title',
    subtitle: 'site.thx.reset',
    button: 'login',
    linkTo: '/login',
  },
  register: {
    headline: 'site.thx.title',
    subtitle: 'site.thx.register',
    button: 'site.login.signin',
    // linkTo: '/login',
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
    button: 'settings.password.reset',
    linkTo: '/forgot-password',
  },
}

export default {
  name: 'Message',
  props: {
    kind: { type: String, required: true },
  },
  data() {
    return {
      displaySetup: textFields[this.kind]
    }
  },
}
</script>
