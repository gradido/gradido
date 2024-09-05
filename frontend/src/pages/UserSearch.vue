<template>
  <div class="usersearch">
    <b-container class="bg-white appBoxShadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('usersearch.headline') }}</div>
      <div class="my-4 text-small">
        <span
          v-for="(line, lineNumber) of $t('usersearch.text').split('\n')"
          v-bind:key="lineNumber"
        >
          {{ line }}
          <br />
        </span>
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
  beforeMount() {
    // eslint-disable-next-line
    console.log('UserSearch.vue beforeMount...')
    this.authenticateGmsUserPlayground()
  },
  beforeUpdate() {
    // eslint-disable-next-line
    console.log('UserSearch.vue beforeUpdate...')
    this.authenticateGmsUserPlayground()
  },
}
</script>
