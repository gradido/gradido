import { communityInfo } from '../graphql/queries'

export const getCommunityInfo = {
  created() {
    if (!this.$store.state.community) {
      this.$apollo
        .query({
          query: communityInfo,
        })
        .then((result) => {
          this.$store.commit('community', result.data.getCommunityInfo)
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    }
  },
}
