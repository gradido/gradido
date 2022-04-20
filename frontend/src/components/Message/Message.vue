<template>
  <div>
    <!-- Header -->
    <div class="header py-lg-6">
      <b-container>
        <div class="header-body text-center mb-7">
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <p class="h1 test-message-headline">{{ $t(displaySetup.headline) }}</p>
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <p class="h4 test-message-subtitle">{{ $t(displaySetup.subtitle) }}</p>
          <hr />
          <b-button
            v-if="displaySetup.linkTo"
            class="test-message-button"
            :to="displaySetup.linkTo + (code ? `/${code}` : '')"
          >
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
  'forgot-password-success': {
    headline: 'site.thx.title',
    subtitle: 'site.thx.email',
    button: 'login',
    linkTo: '/login',
  },
  'forgot-password-error': {
    headline: 'site.thx.errorTitle',
    subtitle: 'error.email-already-sent',
    button: 'login',
    linkTo: '/login',
  },
  'reset-password': {
    headline: 'site.thx.title',
    subtitle: 'site.thx.reset',
    button: 'login',
    linkTo: '/login',
  },
  register: {
    headline: 'site.thx.title',
    subtitle: 'site.thx.register',
    button: 'site.login.signin',
    linkTo: '/login',
  },
  'check-email': {
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
    code: { type: String, default: '' },
  },
  data() {
    return {
      displaySetup: textFields[this.kind],
    }
  },
}
</script>
