<template>
  <div class="federation-visualize">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <span class="h2">{{ $t('federation.gradidoInstances') }}</span>
      <b-button>
        <b-icon
          icon="arrow-clockwise"
          font-scale="2"
          :animation="animation"
          data-test="federation-communities-refresh-btn"
          @click="$apollo.queries.allCommunities.refresh()"
        ></b-icon>
      </b-button>
    </div>
    <b-list-group>
      <b-row>
        <b-col cols="1" class="ml-1">{{ $t('federation.verified') }}</b-col>
        <b-col class="ml-3">{{ $t('federation.url') }}</b-col>
        <b-col class="ml-3">{{ $t('federation.name') }}</b-col>
        <b-col cols="2">{{ $t('federation.lastAnnouncedAt') }}</b-col>
        <b-col cols="2">{{ $t('federation.createdAt') }}</b-col>
      </b-row>
      <b-list-group-item
        v-for="item in communities"
        :key="item.publicKey"
        :variant="!item.foreign ? 'primary' : 'warning'"
      >
        <community-visualize-item :item="item" />
      </b-list-group-item>
    </b-list-group>
  </div>
</template>
<script>
import { allCommunities } from '@/graphql/allCommunities'

import CommunityVisualizeItem from '../components/Federation/CommunityVisualizeItem.vue'

export default {
  name: 'FederationVisualize',
  components: {
    CommunityVisualizeItem,
  },
  data() {
    return {
      oldPublicKey: '',
      communities: [],
      icon: '',
    }
  },
  computed: {
    animation() {
      return this.$apollo.queries.allCommunities.loading ? 'spin' : ''
    },
  },
  apollo: {
    allCommunities: {
      fetchPolicy: 'network-only',
      query() {
        return allCommunities
      },
      update({ allCommunities }) {
        this.communities = allCommunities
      },
      error({ message }) {
        this.toastError(message)
      },
    },
  },
}
</script>
