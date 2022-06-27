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
          <div class="p-3 text-danger h3">
            {{ $t('session.lightText') }}
            <b>{{ closeTime }}</b>
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
      millisecondsShowModal: 75000,
      millisecondsCheckTokenInterval: 15000,
      closeTime: 60,
      sound: new Audio('sound/Air-Plane-Ding-SoundBible.com-496729130.mp3'),
    }
  },
  methods: {
    timeout() {
      if (this.closeTime > 0) {
        this.closeTime = this.closeTime - 1
      } else {
        clearInterval(this.$options.interval2)
        clearInterval(this.$options.interval3)
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
          clearInterval(this.$options.interval2)
          clearInterval(this.$options.interval3)
          this.$bvModal.hide('modalSessionTimeOut')
          this.closeTime = 60
          this.$options.interval1 = setInterval(this.log, this.millisecondsCheckTokenInterval)
        })
        .catch(() => {
          this.$emit('logout')
        })
    },
    log() {
      if (this.$route.meta.requiresAuth) {
        const now = new Date().getTime()
        const exp = new Date(this.$store.state.tokenTime * 1000).getTime()
        const diff = exp - now
        // console.log(diff)
        if (diff < this.millisecondsShowModal) {
          this.closeTime = Math.floor(diff / 1000)
          this.sound.play()
          this.$options.interval3 = setInterval(this.playSound, 13000)
          this.$options.interval2 = setInterval(this.timeout, 1000)
          clearInterval(this.$options.interval1)
          this.$bvModal.show('modalSessionTimeOut')
        }
      }
    },
    playSound() {
      this.sound.play()
    },
  },
  created() {
    this.$options.interval1 = setInterval(this.log, this.millisecondsCheckTokenInterval)
  },
  beforeDestroy() {
    clearInterval(this.$options.interval1)
    clearInterval(this.$options.interval2)
    clearInterval(this.$options.interval3)
  },
}
</script>
