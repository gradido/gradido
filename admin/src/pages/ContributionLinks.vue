<template>
  <div class="contribution-link">
    <contribution-link
      :items="items"
      :count="count"
      @get-contribution-links="getContributionLinks"
    />
  </div>
</template>
<script>
import { listContributionLinks } from '@/graphql/listContributionLinks.js'
import ContributionLink from '../components/ContributionLink/ContributionLink.vue'

export default {
  name: 'ContributionLinks',
  components: {
    ContributionLink,
  },
  data() {
    return {
      items: [],
      count: 0,
    }
  },
  methods: {
    getContributionLinks() {
      this.$apollo
        .query({
          query: listContributionLinks,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.count = result.data.listContributionLinks.count
          this.items = result.data.listContributionLinks.links
        })
        .catch(() => {
          this.toastError('listContributionLinks has no result, use default data')
        })
    },
  },
  created() {
    this.getContributionLinks()
  },
}
</script>
