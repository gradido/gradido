import { communityInfo } from '../graphql/queries'

export const getCommunityInfo = {
  beforeCreate() {
    if (!this.$store.state.community) {
      this.$apollo
        .query({
          query: communityInfo,
        })
        .then((result) => {
          // console.log('Got a community info: ', result.data.getCommunityInfo)
          this.$store.commit('community', result.data.getCommunityInfo)
        })
        .catch((error) => {
          // console.log('Got a error: ', error.message)
          this.$toasted.error(error.message)
        })
    }
  },
}
