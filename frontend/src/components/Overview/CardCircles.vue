<template>
  <div class="mb-3 p-3 card-circles">
  <BContainer class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
    <div class="h3">{{ $t('card-circles.headline') }}</div>
    <div v-if="humhubAllowed" class="my-3 text-small">
      <span v-for="(line, lineNumber) of $t('card-circles.allowed.text').split('\n')" :key="lineNumber">
        {{ line }}
        <br />
      </span>
    </div>
    <div v-else class="my-3 text-small">
      <span v-for="(line, lineNumber) of $t('card-circles.not-allowed.text').split('\n')" :key="lineNumber">
        {{ line }}
        <br />
      </span>
    </div>
    <BRow class="my-1">
      <BCol cols="12">
        <div class="text-lg-end">
          <BButton
            v-if="humhubAllowed"
            :href="humhubUri"
            variant="gradido"
            :disabled="enableButton === false"
            target="_blank"
          >
            {{ $t('card-circles.allowed.button') }}
          </BButton>
          <RouterLink v-else to="/settings/extern">
            <BButton variant="gradido">
              {{ $t('card-circles.not-allowed.button') }}
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
<style scoped>
.card {
  background-attachment: absolute;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 350px 350px;
  background-image: url('/img/svg/Gradido_Blaetter_Mainpage.svg') !important;
}
</style>
