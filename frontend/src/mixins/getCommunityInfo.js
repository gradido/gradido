import { communityInfo } from '../graphql/queries'

export const getCommunityInfoMixin = {
  methods: {
    getCommunityInfo() {
      if (this.$store.state.community.name === '') {
        this.$apollo
          .query({
            query: communityInfo,
          })
          .then((result) => {
            this.$store.commit('community', result.data.getCommunityInfo)
            return result.data.getCommunityInfo
          })
          .catch((error) => {
            this.$toasted.error(error.message)
          })
      }
    },
  },
  created() {
    this.getCommunityInfo()
  },
}
