<template>
  <div class="session-logout-timeout">
    <b-modal
      id="modalSessionTimeOut"
      class="bg-variant-danger"
      hide-header-close
      hide-header
      hide-footer
      no-close-on-backdrop
    >
      <b-card header-tag="header" footer-tag="footer">
        <b-card-text>
          <div class="p-3 h2">{{ $t('session.warningText') }}</div>
          <div class="p-3">
            {{ $t('session.lightText') }}
          </div>
          <div class="p-3 h2 text-warning">
            {{ $t('session.logoutIn') }}
            <b>{{ tokenExpiresInSeconds }}</b>
            {{ $t('time.seconds') }}
          </div>
        </b-card-text>
        <b-row>
          <b-col class="text-center">
            <b-button size="lg" variant="success" @click="handleOk">
              {{ $t('session.extend') }}
            </b-button>
          </b-col>
        </b-row>
      </b-card>
      <template #modal-footer>
        <b-button size="sm" variant="danger" @click="$emit('logout')">
          {{ $t('navigation.logout') }}
        </b-button>
        <b-button size="lg" variant="success" @click="handleOk">
          {{ $t('session.extend') }}
        </b-button>
      </template>
    </b-modal>
  </div>
</template>
<script>
import { verifyLogin } from '@/graphql/queries'

export default {
  name: 'SessionLogoutTimeout',
  data() {
    return {
      now: new Date().getTime(),
    }
  },
  timers: {
    tokenExpires: {
      time: 15000,
      autostart: true,
      repeat: true,
      immediate: true,
    },
  },
  methods: {
    tokenExpires() {
      this.now = new Date().getTime()
      if (this.tokenExpiresInSeconds < 75 && this.timers.tokenExpires.time !== 1000) {
        this.timers.tokenExpires.time = 1000
        this.$timer.restart('tokenExpires')
        this.$bvModal.show('modalSessionTimeOut')
      }
      if (this.tokenExpiresInSeconds === 0) {
        this.$timer.stop('tokenExpires')
        this.toastInfoNoHide('Du wurdest automatisch abgemeldet')
        this.$emit('logout')
      }
    },
    handleOk(bvModalEvent) {
      bvModalEvent.preventDefault()
      this.$apollo
        .query({
          query: verifyLogin,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.timers.tokenExpires.time = 15000
          this.$timer.restart('tokenExpires')
          this.$bvModal.hide('modalSessionTimeOut')
        })
        .catch(() => {
          this.$timer.stop('tokenExpires')
          this.toastInfoNoHide('Du wurdest automatisch abgemeldet')
          this.$emit('logout')
        })
    },
  },
  computed: {
    tokenExpiresInSeconds() {
      const remainingSecs = Math.floor(
        (new Date(this.$store.state.tokenTime * 1000).getTime() - this.now) / 1000,
      )
      return remainingSecs <= 0 ? 0 : remainingSecs
    },
  },
  beforeDestroy() {
    this.$timer.stop('tokenExpires')
  },
}
</script>
