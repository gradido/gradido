<template>
  <div class="community-switch">
    <div v-if="!validCommunityIdentifier">
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
    <div v-else class="mb-4 mt-2">
      <b-row>
        <b-col class="font-weight-bold" :title="value.description">{{ value.name }}</b-col>
      </b-row>
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
<style>
.community-switch > div,
.community-switch ul.dropdown-menu {
  width: 100%;
}
.community-switch > div > button {
  border-radius: 17px;
  height: 50px;
  text-align: left;
}
.community-switch .dropdown-toggle::after {
  float: right;
  top: 50%;
  transform: translateY(-50%);
  position: relative;
}
</style>
