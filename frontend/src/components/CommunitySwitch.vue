<template>
  <div class="community-switch">
    <b-dropdown no-flip :text="value.name">
      <b-dropdown-item
        v-for="community in communities"
        @click.prevent="updateCommunity(community)"
        :key="community.id"
        :title="community.description"
        :active="value.id === community.id"
      >
        {{ community.name }}
      </b-dropdown-item>
    </b-dropdown>
  </div>
</template>
<script>
import { selectCommunities } from '@/graphql/queries'
import { COMMUNITY_NAME } from '@/config'

export default {
  name: 'CommunitySwitch',
  props: {
    value: { type: Object, default: { id: 0, name: COMMUNITY_NAME } },
  },
  data() {
    return {
      communities: [],
    }
  },
  methods: {
    updateCommunity(community) {
      this.value = community
      this.$emit('input', this.value)
    },
    setDefaultCommunity() {
      // set default community, the only one which isn't foreign
      // we assume it is only one entry with foreign = false
      if (!this.value.id && this.communities.length) {
        const foundCommunity = this.communities.find((community) => !community.foreign)
        if (foundCommunity) {
          this.updateCommunity(foundCommunity)
        }
      }
    },
  },
  apollo: {
    communities: {
      query: selectCommunities,
    },
  },
  mounted() {
    this.setDefaultCommunity()
  },
  updated() {
    this.setDefaultCommunity()
  },
}
</script>
