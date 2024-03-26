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
      gmsPlaygroundUri: '',
    }
  },
  /*
  async mounted() {
    let query = `{
      authenticateGmsUserSearch() {
        gmsPlaygroundUri
      }
    }`;
  },
  */
  methods: {
    authenticateGmsUserPlayground() {
      this.$apollo
        .query({
          query: authenticateGmsUserSearch,
        })
        .then((result) => {
          this.gmsPlaygroundUri = result.data.authenticateGmsUserSearch.gmsPlaygroundUri
        })
        .catch(() => {
          this.toastError('listContributionLinks has no result, use default data')
        })
    },
  },
  created() {
    this.authenticateGmsUserPlayground()
  },
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
