<template>
  <div class="mb-3 p-3 card-circles">
    <BContainer class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('card-circles.headline') }}</div>
      <div class="my-3 text-small">
        <span v-for="(line, lineNumber) of $t('card-circles.text').split('\n')" :key="lineNumber">
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
import { useMutation } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import { authenticateHumhubAutoLogin } from '@/graphql/mutations'

const store = useStore()

const enableButton = ref(false)
const humhubUri = ref('')

const humhubAllowed = computed(() => store.state.humhubAllowed)

const {
  onDone,
  mutate: mutateHumhubAutoLogin,
  onError,
  called,
} = useMutation(
  authenticateHumhubAutoLogin,
  {},
  {
    fetchPolicy: 'network-only',
    enabled: true,
  },
)

onDone(({ data }) => {
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

onMounted(() => {
  if (!called.value) {
    mutateHumhubAutoLogin()
  }
})
</script>
<style scoped>
.card {
  background-attachment: scroll;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 350px 350px;
  background-image: url('/img/svg/Gradido_Blaetter_Mainpage.svg') !important;
}
</style>
