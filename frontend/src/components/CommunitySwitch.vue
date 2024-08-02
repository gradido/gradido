<template>
  <div class="community-switch">
    <div v-if="!validCommunityIdentifier">
      <BDropdown no-flip :text="value.name">
        <BDropdownItem
          v-for="community in communities"
          @click.prevent="updateCommunity(community)"
          :key="community.id"
          :title="community.description"
          :active="value.uuid === community.uuid"
        >
          {{ community.name }}
        </BDropdownItem>
      </BDropdown>
    </div>
    <div v-else class="mb-4 mt-2">
      <BRow>
        <BCol class="font-weight-bold" :title="value.description">{{ value.name }}</BCol>
      </BRow>
    </div>
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
      validCommunityIdentifier: false,
    }
  },
  methods: {
    updateCommunity(community) {
      this.$emit('input', community)
    },
    setDefaultCommunity() {
      // when we already get an identifier via url we choose this if the community exist
      if (this.communityIdentifier && this.communities.length >= 1) {
        const foundCommunity = this.communities.find((community) => {
          if (
            community.uuid === this.communityIdentifier ||
            community.name === this.communityIdentifier
          ) {
            this.validCommunityIdentifier = true
            return true
          }
          return false
        })
        if (foundCommunity) {
          this.updateCommunity(foundCommunity)
          return
        }
        this.toastError('invalid community identifier in url')
      }
      if (this.validCommunityIdentifier && !this.communityIdentifier) {
        this.validCommunityIdentifier = false
      }
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
  computed: {
    communityIdentifier() {
      return this.$route.params && this.$route.params.communityIdentifier
    },
  },
  updated() {
    this.setDefaultCommunity()
  },
  mounted() {
    this.setDefaultCommunity()
  },
}
</script>
