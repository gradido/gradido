<template>
  <div class="community-switch">
    <b-dropdown no-flip :text="value.name">
      <b-dropdown-item
        v-for="community in communities"
        @click.prevent="updateCommunity(community)"
        :key="community.id"
        :title="community.description"
        :active="value.uuid === community.uuid"
      >
        {{ community.name }}
      </b-dropdown-item>
    </b-dropdown>
  </div>
</template>
<script>
import { selectCommunities } from '@/graphql/queries'

export default {
  name: 'CommunitySwitch',
  props: {
    value: {
      type: Object,
    },
  },
  data() {
    return {
      communities: [],
    }
  },
  methods: {
    updateCommunity(community) {
      this.$emit('input', community)
    },
    setDefaultCommunity() {
      // set default community, the only one which isn't foreign
      // we assume it is only one entry with foreign = false
      if (this.value.uuid === '' && this.communities.length) {
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
