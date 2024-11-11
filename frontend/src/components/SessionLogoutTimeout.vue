<template>
  <div class="session-logout-timeout">
    <BModal
      id="modalSessionTimeOut"
      class="bg-variant-danger"
      hide-header-close
      hide-header
      hide-footer
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
        <BRow>
          <BCol class="text-center">
            <BButton size="lg" variant="success" @click="handleOk">
              {{ $t('session.extend') }}
            </BButton>
          </BCol>
        </BRow>
      </BCard>
      <template #modal-footer>
        <BButton size="sm" variant="danger" @click="emit('logout')">
          {{ $t('navigation.logout') }}
        </BButton>
        <BButton size="lg" variant="success" @click="handleOk">
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
import { BButton, BCard, BCardText, BCol, BModal, BRow, useModal } from 'bootstrap-vue-next'

const store = useStore()
const emit = defineEmits(['logout'])

const sessionModalModel = ref(false)
const { hide: hideModal } = useModal('modalSessionTimeOut')

const { load: verifyLoginQuery, loading, error } = useLazyQuery(verifyLogin)

const remainingTime = ref(0)
let intervalId = null

const tokenExpirationTime = computed(() => new Date(store.state.tokenTime * 1000))

const isTokenValid = computed(() => {
  return remainingTime.value > 0
})

const calculateRemainingTime = () => {
  const now = new Date()
  const diff = tokenExpirationTime.value - now
  remainingTime.value = Math.max(0, Math.floor(diff / 1000))
  // Show modal if remaining time is 75 seconds or less
  if (remainingTime.value <= 75) {
    sessionModalModel.value = true
  }
  // Clear interval if time expired
  if (remainingTime.value <= 0) {
    clearInterval(intervalId)
  }
}

const formatTime = (seconds) => {
  if (seconds <= 0) return '00'
  return `${seconds.toString().padStart(2, '0')}`
}

onMounted(() => {
  calculateRemainingTime()

  if (isTokenValid.value) {
    intervalId = setInterval(calculateRemainingTime, 1000)
  }
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

watch(remainingTime, (newTime) => {
  if (newTime <= 0) {
    emit('logout')
  }
})

const handleOk = async (bvModalEvent) => {
  bvModalEvent.preventDefault()
  try {
    await verifyLoginQuery()
    if (error.value) {
      emit('logout')
      throw new Error('Login verification failed')
    }
    hideModal('modalSessionTimeOut')
  } catch {
    emit('logout')
  }
}
</script>
