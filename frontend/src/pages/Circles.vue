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
              v-if="this.humhubAllowed"
              variant="gradido"
              :href="this.humhubUri"
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
import { authenticateCirclesAutoLogin } from '@/graphql/queries'
export default {
  name: 'Circles',
  data() {
    return {
      humhubUri: 'not initialized',
    }
  },
  computed: {
    humhubAllowed() {
      return this.$store.state.humhubAllowed
    },
  },
  methods: {
    async authenticateCirclesAutoLogin() {
      this.$apollo
        .query({
          query: authenticateCirclesAutoLogin,
        })
        .then(async (result) => {
          this.humhubUri = result.data.authenticateCirclesAutoLogin
        })
        .catch(() => {
          this.toastError('authenticateCirclesAutoLogin failed!')
        })
    },
  },
  created() {
    this.authenticateCirclesAutoLogin()
  },
}
</script>
