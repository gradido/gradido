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
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { useStore } from 'vuex'
import { useLazyQuery } from '@vue/apollo-composable'
import { verifyLogin } from '@/graphql/queries'
import { useModal } from 'bootstrap-vue-next'

const store = useStore()

const emit = defineEmits(['logout'])

const sessionModalModel = ref(false)

const { show: showModal, hide: hideModal } = useModal('modalSessionTimeOut')

const { load: verifyLoginQuery, loading, error } = useLazyQuery(verifyLogin)

const timerInterval = ref(null)

const now = ref(new Date().getTime())

const tokenExpiresInSeconds = computed(() => {
  const remainingSecs = Math.floor(
    (new Date(store.state.tokenTime * 1000).getTime() - now.value) / 1000,
  )
  return remainingSecs <= 0 ? 0 : remainingSecs
})

const updateNow = () => {
  now.value = new Date().getTime()
}

const checkExpiration = () => {
  if (tokenExpiresInSeconds.value < 75 && timerInterval.value && !sessionModalModel.value) {
    showModal()
  }
  if (tokenExpiresInSeconds.value === 0) {
    stopTimer()
    emit('logout')
  }
}

const handleOk = async (bvModalEvent) => {
  bvModalEvent.preventDefault()
  try {
    await verifyLoginQuery()
    if (error.value) {
      throw new Error('Login verification failed')
    }
    hideModal('modalSessionTimeOut')
  } catch {
    stopTimer()
    emit('logout')
  }
}

const startTimer = () => {
  stopTimer()
  timerInterval.value = setInterval(() => {
    updateNow()
    checkExpiration()
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

watch(
  tokenExpiresInSeconds,
  (newValue) => {
    if (newValue < 75 && !timerInterval.value) {
      startTimer()
    } else if (newValue >= 75 && timerInterval.value) {
      stopTimer()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopTimer()
})

checkExpiration()
</script>
