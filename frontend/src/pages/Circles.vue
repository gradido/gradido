<template>
  <div class="circles">
    <b-container class="bg-white appBoxShadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('circles.headline') }}</div>
      <div class="my-4 text-small">
        <span v-for="(line, lineNumber) of $t('circles.text').split('\n')" v-bind:key="lineNumber">
          {{ line }}
          <br />
        </span>
      </div>
      <b-row class="my-5">
        <b-col cols="12">
          <div class="text-lg-right">
            <b-button
              :href="this.humhubUri"
              v-if="this.humhubAllowed"
              variant="gradido"
              :disabled="this.enableButton === false"
              target="_blank"
            >
              {{ $t('circles.button') }}
            </b-button>
            <RouterLink v-else to="/settings/extern">
              <b-button variant="gradido">
                {{ $t('circles.button') }}
              </b-button>
            </RouterLink>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import { authenticateHumhubAutoLogin } from '@/graphql/queries'
export default {
  name: 'Circles',
  data() {
    return {
      enableButton: false,
      humhubUri: '',
    }
  },
  computed: {
    humhubAllowed() {
      return this.$store.state.humhubAllowed
    },
  },
  methods: {
    async authenticateHumhubAutoLogin() {
      this.enableButton = false
      this.humhubUri = null
      this.$apollo
        .query({
          query: authenticateHumhubAutoLogin,
          fetchPolicy: 'network-only',
        })
        .then(async (result) => {
          this.humhubUri = result.data.authenticateHumhubAutoLogin
          this.enableButton = true
        })
        .catch(() => {
          // this.toastError('authenticateHumhubAutoLogin failed!')
          this.enableButton = true
          // something went wrong with login link so we disable humhub
          this.$store.commit('humhubAllowed', false)
          this.$router.push('/settings/extern')
        })
    },
  },
  created() {
    this.authenticateHumhubAutoLogin()
  },
}
</script>
