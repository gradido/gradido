<template>
  <div class="usersearch">
    <b-container class="bg-white appBoxShadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('usersearch.headline') }}</div>
      <div class="my-4 text-small">
        {{ $t('usersearch.text') }}
      </div>
      <!-- div class="my-4 text-small">
        {{ this.gmsUri }}
      </div -->
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
// import GmsInfo from '@/assets/UserSearch/usersearchinfo.json'
export default {
  name: 'UserSearch',
  data() {
    return {
      gmsUri: 'not initialized',
      // 'http://localhost:8080/playground?access_token=pk.eyJ1IjoidmlrYXNpbG16IiwiYSI6ImNsbG03NzNkNTFwZXMzbHQ2bTV6NHA0ZjgifQ.knlN4jnVdmhDkJTaka5RoQ&coords=[9.620812595440933,49.695725844876904]',
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
  /*
  openGmsUserPlayground: function () {
    window.open(this.gmsPlaygroundUrl + '?' + this.gmsAuthToken, '_blank')
    // let uri = this.gmsPlaygroundUrl + '?' + this.gmsAuthToken
    // let route = this.$router.resolve({path: uri});
    /// / let route = this.$router.resolve('/link/to/page'); // This also works.
    // window.open(route.href, '_blank');
  },
  beforeCreate() {
    this.authenticateGmsUserPlayground()
  },
  */
  created() {
    this.authenticateGmsUserPlayground()
    // this.openGmsUserPlayground()
  },
}
</script>
