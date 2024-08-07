<template>
  <div class="session-logout-timeout">
    <BModal
      id="modalSessionTimeOut"
      class="bg-variant-danger"
      hide-header-close
      hide-header
      hide-footer
      no-close-on-backdrop
    >
      <BCard header-tag="header" footer-tag="footer">
        <BCardText>
          <div class="p-3 h2">{{ $t('session.warningText') }}</div>
          <div class="p-3">
            {{ $t('session.lightText') }}
          </div>
          <div class="p-3 h2 text-warning">
            {{ $t('session.logoutIn') }}
            <b>{{ tokenExpiresInSeconds }}</b>
            {{ $t('time.seconds') }}
          </div>
        </BCardText>
        <BRow>
          <BCol class="text-center">
            <BButton size="lg" variant="success" @click="handleOk">
              {{ $t('session.extend') }}
            </BButton>
          </BCol>
        </BRow>
      </BCard>
      <template #modal-footer>
        <BButton size="sm" variant="danger" @click="$emit('logout')">
          {{ $t('navigation.logout') }}
        </BButton>
        <BButton size="lg" variant="success" @click="handleOk">
          {{ $t('session.extend') }}
        </BButton>
      </template>
    </BModal>
  </div>
</template>
<!--<script>-->
<!--import { verifyLogin } from '@/graphql/queries'-->

<!--export default {-->
<!--  name: 'SessionLogoutTimeout',-->
<!--  data() {-->
<!--    return {-->
<!--      now: new Date().getTime(),-->
<!--    }-->
<!--  },-->
<!--  timers: {-->
<!--    tokenExpires: {-->
<!--      time: 15000,-->
<!--      autostart: true,-->
<!--      repeat: true,-->
<!--      immediate: true,-->
<!--    },-->
<!--  },-->
<!--  methods: {-->
<!--    tokenExpires() {-->
<!--      this.now = new Date().getTime()-->
<!--      if (this.tokenExpiresInSeconds < 75 && this.timers.tokenExpires.time !== 1000) {-->
<!--        this.timers.tokenExpires.time = 1000-->
<!--        this.$timer.restart('tokenExpires')-->
<!--        this.$bvModal.show('modalSessionTimeOut')-->
<!--      }-->
<!--      if (this.tokenExpiresInSeconds === 0) {-->
<!--        this.$timer.stop('tokenExpires')-->
<!--        this.$emit('logout')-->
<!--      }-->
<!--    },-->
<!--    handleOk(bvModalEvent) {-->
<!--      bvModalEvent.preventDefault()-->
<!--      this.$apollo-->
<!--        .query({-->
<!--          query: verifyLogin,-->
<!--          fetchPolicy: 'network-only',-->
<!--        })-->
<!--        .then((result) => {-->
<!--          this.timers.tokenExpires.time = 15000-->
<!--          this.$timer.restart('tokenExpires')-->
<!--          this.$bvModal.hide('modalSessionTimeOut')-->
<!--        })-->
<!--        .catch(() => {-->
<!--          this.$timer.stop('tokenExpires')-->
<!--          this.$emit('logout')-->
<!--        })-->
<!--    },-->
<!--  },-->
<!--  computed: {-->
<!--    tokenExpiresInSeconds() {-->
<!--      const remainingSecs = Math.floor(-->
<!--        (new Date(this.$store.state.tokenTime * 1000).getTime() - this.now) / 1000,-->
<!--      )-->
<!--      return remainingSecs <= 0 ? 0 : remainingSecs-->
<!--    },-->
<!--  },-->
<!--  beforeDestroy() {-->
<!--    this.$timer.stop('tokenExpires')-->
<!--  },-->
<!--}-->
<!--</script>-->
<script setup>
//TODO to be checked and fixed
import { ref, computed, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { useLazyQuery } from '@vue/apollo-composable'
import { useTimer } from 'vue-timer-hook' //TODO change to updated version
import { useModal } from 'bootstrap-vue-next'
import { verifyLogin } from '@/graphql/queries'

const store = useStore()
const { result, load: verifyLoginQuery } = useLazyQuery(verifyLogin)
const { modal } = useModal()
const timer = useTimer()

console.log(timer)

const emit = defineEmits(['logout'])

const now = ref(new Date().getTime())

const tokenExpiresInSeconds = computed(() => {
  const remainingSecs = Math.floor(
    (new Date(store.state.tokenTime * 1000).getTime() - now.value) / 1000,
  )
  return remainingSecs <= 0 ? 0 : remainingSecs
})

const handleOk = async () => {
  console.log('OK')
}

// const tokenExpires = () => {
//   now.value = new Date().getTime()
//   if (tokenExpiresInSeconds.value < 75 && timer.value.tokenExpires.time !== 1000) {
//     timer.value.tokenExpires.time = 1000
//     restartTimer('tokenExpires')
//     modal.show('modalSessionTimeOut')
//   }
//   if (tokenExpiresInSeconds.value === 0) {
//     stopTimer('tokenExpires')
//     emit('logout')
//   }
// }
//
// const handleOk = (bvModalEvent) => {
//   bvModalEvent.preventDefault()
//   verifyLoginQuery({
//     fetchPolicy: 'network-only',
//   })
//     .then(() => {
//       timer.value.tokenExpires.time = 15000
//       restartTimer('tokenExpires')
//       modal.hide('modalSessionTimeOut')
//     })
//     .catch(() => {
//       stopTimer('tokenExpires')
//       emit('logout')
//     })
// }
//
// // Start the timer
// startTimer('tokenExpires', {
//   time: 15000,
//   callback: tokenExpires,
//   immediate: true,
// })
//
// onBeforeUnmount(() => {
//   stopTimer('tokenExpires')
// })
</script>
