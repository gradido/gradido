<template>
  <div class="usersearch">
    <b-container class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('usersearch.headline') }}</div>
      <div class="my-4 text-small">
        <span v-for="(line, lineNumber) of $t('usersearch.text').split('\n')" :key="lineNumber">
          {{ line }}
          <br />
        </span>
      </div>
      <BRow class="my-5">
        <BCol cols="12">
          <div class="text-lg-right">
            <b-button variant="gradido" :href="gmsUri" target="_blank">
              {{ $t('usersearch.button') }}
            </b-button>
          </div>
        </BCol>
      </BRow>
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
  created() {
    this.authenticateGmsUserPlayground()
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
}
</script>
