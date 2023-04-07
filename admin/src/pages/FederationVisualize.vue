<template>
  <div class="federation-visualize">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <span class="h2">{{ $t('federation.gradidoInstances') }}</span>
      <b-button>
        <b-icon
          icon="arrow-clockwise"
          font-scale="2"
          :animation="animation"
          @click="$apollo.queries.GetCommunities.refresh()"
          data-test="federation-communities-refresh-btn"
        ></b-icon>
      </b-button>
    </div>
    <b-list-group>
      <b-row>
        <b-col cols="1" class="ml-1">{{ $t('federation.verified') }}</b-col>
        <b-col class="ml-3">{{ $t('federation.url') }}</b-col>
        <b-col cols="2">{{ $t('federation.lastAnnouncedAt') }}</b-col>
        <b-col cols="2">{{ $t('federation.createdAt') }}</b-col>
      </b-row>
      <b-list-group-item
        v-for="item in communities"
        :key="item.id"
        :variant="!item.foreign ? 'primary' : 'warning'"
      >
        <federation-visualize-item :item="item" />
      </b-list-group-item>
    </b-list-group>
  </div>
</template>
<script>
import { getCommunities } from '@/graphql/getCommunities'

import FederationVisualizeItem from '../components/Fedaration/FederationVisualizeItem.vue'

export default {
  name: 'FederationVisualize',
  components: {
    FederationVisualizeItem,
  },
  data() {
    return {
      oldPublicKey: '',
      communities: [],
      icon: '',
      animation: '',
    }
  },
  apollo: {
    GetCommunities: {
      fetchPolicy: 'network-only',
      query() {
        this.animation = 'spin'

        return getCommunities
      },
      update({ getCommunities }) {
        this.communities = getCommunities
        this.animation = ''
      },
      error({ message }) {
        this.toastError(message)
        this.animation = ''
      },
    },
  },
}
</script>
