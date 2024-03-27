<template>
  <div class="h3">
    {{ gmsPlaygroundUri }}
  </div>
</template>
<script>
import { authenticateGmsUserSearch } from '@/graphql/queries'

export default {
  name: 'GMS User Playground',
  data() {
    return {
      gmsPlaygroundUrl: 'unknown',
      gmsAuthToken: '',
    }
  },
  methods: {
    authenticateGmsUserPlayground() {
      this.$apollo
        .query({
          query: authenticateGmsUserSearch,
        })
        .then((result) => {
          this.gmsPlaygroundUrl = result.data.url,
          this.gmsAuthToken = result.data.token
        })
        .catch(() => {
          this.toastError('listContributionLinks has no result, use default data')
        })
    },
  },
  /*
  openGmsUserPlayground: function () {
    // window.open(this.gmsPlaygroundUrl + '?' + this.gmsAuthToken, '_blank')
    let uri = this.gmsPlaygroundUrl + '?' + this.gmsAuthToken
    let route = this.$router.resolve({path: uri});
    // let route = this.$router.resolve('/link/to/page'); // This also works.
    window.open(route.href, '_blank');
  },
  */
  created() {
    this.authenticateGmsUserPlayground()
  },
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
