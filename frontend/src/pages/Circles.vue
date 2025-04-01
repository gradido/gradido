<template>
  <div class="circles">
    <BContainer class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('circles.headline') }}</div>
      <div class="my-4 text-small">
        <span v-for="(line, lineNumber) of $t('circles.text').split('\n')" :key="lineNumber">
          {{ line }}
          <br />
        </span>
      </div>
      <BRow class="my-5">
        <BCol cols="12">
          <div class="text-lg-end">
            <BButton
              v-if="humhubAllowed"
              :href="humhubUri"
              variant="gradido"
              :disabled="enableButton === false"
              target="_blank"
            >
              {{ $t('circles.button') }}
            </BButton>
            <RouterLink v-else to="/settings/extern">
              <BButton variant="gradido">
                {{ $t('circles.button') }}
              </BButton>
            </RouterLink>
          </div>
        </BCol>
      </BRow>
    </BContainer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import { authenticateHumhubAutoLogin } from '@/graphql/queries'

const store = useStore()

const enableButton = ref(false)
const humhubUri = ref('')

const humhubAllowed = computed(() => store.state.humhubAllowed)

const {
  refetch: refetchAuthenticateHumhub,
  onResult,
  onError,
} = useQuery(authenticateHumhubAutoLogin, null, {
  fetchPolicy: 'network-only',
  enabled: true,
})

onResult(({ data }) => {
  if (data) {
    humhubUri.value = data.authenticateHumhubAutoLogin
    enableButton.value = true
  }
})

onError(() => {
  enableButton.value = true
  humhubUri.value = ''
  store.commit('humhubAllowed', false)
})

const handleAuthenticateHumhubAutoLogin = async () => {
  enableButton.value = false
  humhubUri.value = null
  await refetchAuthenticateHumhub()
}

onMounted(() => {
  handleAuthenticateHumhubAutoLogin()
})
</script>
