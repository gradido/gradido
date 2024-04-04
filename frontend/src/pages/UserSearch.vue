<template>
  <div class="usersearch">
    <b-container class="bg-white appBoxShadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('usersearch.headline') }}</div>
      <div class="my-4 text-small">
        {{ $t('usersearch.text') }}
      </div>
      <b-row class="my-5">
        <b-col cols="12">
          <div class="text-lg-right">
            <b-button variant="gradido" :href="this.gmsUri" target="_blank">
              {{ $t('usersearch.button') }}
            </b-button>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import { authenticateGmsUserSearch } from '@/graphql/queries'
export default {
  name: 'UserSearch',
  data() {
    return {
      gmsUri: 'not initialized',
    }
  },
  methods: {
    async authenticateGmsUserPlayground() {
      this.$apollo
        .query({
          query: authenticateGmsUserSearch,
        })
        .then(async (result) => {
          this.gmsUri =
            result.data.authenticateGmsUserSearch.url +
            '?accesstoken=' +
            result.data.authenticateGmsUserSearch.token
        })
        .catch(() => {
          this.toastError('authenticateGmsUserSearch failed!')
        })
    },
  },
  created() {
    this.authenticateGmsUserPlayground()
  },
}
</script>
