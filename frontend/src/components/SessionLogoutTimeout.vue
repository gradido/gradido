<template>
  <div class="session-logout-timeout">
    <BModal
      id="modalSessionTimeOut"
      class="bg-variant-danger"
      hide-header-close
      hide-header
      no-close-on-backdrop
      :model-value="sessionModalModel"
      @update:modelValue="sessionModalModel = $event"
    >
      <BCard header-tag="header" footer-tag="footer">
        <BCardText>
          <div class="p-3 h2">{{ $t('session.warningText') }}</div>
          <div class="p-3">
            {{ $t('session.lightText') }}
          </div>
          <div class="p-3 h2 text-warning">
            {{ $t('session.logoutIn') }}
            <b>{{ formatTime(remainingTime) }}</b>
            {{ $t('time.seconds') }}
          </div>
        </BCardText>
      </BCard>
      <template #footer>
        <BButton variant="secondary" @click="emit('logout')">
          {{ $t('navigation.logout') }}
        </BButton>
        <BButton variant="gradido" @click="handleOk">
          {{ $t('session.extend') }}
        </BButton>
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useLazyQuery } from '@vue/apollo-composable'
import { verifyLogin } from '@/graphql/queries'
import { BButton, BCard, BCardText, BModal } from 'bootstrap-vue-next'

// Warn the user this many seconds before the session (JWT) expires.
const MODAL_WARNING_SECONDS = 75

const store = useStore()
const emit = defineEmits(['logout'])

const sessionModalModel = ref(false)

// Renewal must hit the network: every response carries a fresh `token` header that
// the Apollo afterware writes to the store, sliding the expiry forward. A cache-first
// query would often skip the network and never actually renew the session.
const { load: loadVerifyLogin, refetch: refetchVerifyLogin } = useLazyQuery(
  verifyLogin,
  {},
  { fetchPolicy: 'network-only' },
)
let verifyLoginLoaded = false

const remainingTime = ref(0)
let intervalId = null

const tokenExpirationTime = computed(() => new Date(store.state.tokenTime * 1000))

const calculateRemainingTime = () => {
  const diff = tokenExpirationTime.value - new Date()
  remainingTime.value = Math.max(0, Math.floor(diff / 1000))
  // Single source of truth: the modal is visible only inside the warning window.
  sessionModalModel.value =
    remainingTime.value > 0 && remainingTime.value <= MODAL_WARNING_SECONDS
  if (remainingTime.value <= 0 && intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const formatTime = (seconds) => {
  if (seconds <= 0) return '00'
  return `${seconds.toString().padStart(2, '0')}`
}

// useLazyQuery's load() runs only once; use refetch() afterwards so every click
// forces a fresh network round-trip (and therefore a fresh token).
const renewSession = async () => {
  if (!verifyLoginLoaded) {
    verifyLoginLoaded = true
    const loaded = await loadVerifyLogin()
    if (loaded) return loaded
  }
  return refetchVerifyLogin()
}

const handleOk = async () => {
  try {
    const result = await renewSession()
    if (!result) throw new Error('session renewal returned no result')
    // Recompute at once so the modal closes as soon as the new expiry is known.
    calculateRemainingTime()
  } catch {
    emit('logout')
  }
}

onMounted(() => {
  calculateRemainingTime()
  intervalId = setInterval(calculateRemainingTime, 1000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})

watch(remainingTime, (newTime) => {
  if (newTime <= 0) emit('logout')
})
</script>
