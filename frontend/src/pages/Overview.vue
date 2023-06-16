<template>
  <div class="overview">
    <community-news />
    <div class="card mt-5">
      <button @click="getNodeInfo">{{ $t('iota.infoButton') }}</button>
      <div v-if="nodeInfo">
        <h2>{{ $t('iota.nodeInfo') }}</h2>

        {{ nodeInfo }}
        <p>
          <strong>{{ $t('iota.name') }}</strong>
          {{ nodeInfo.name }}
        </p>
        <p>
          <strong>{{ $t('iota.version') }}</strong>
          {{ nodeInfo.version }}
        </p>
        <p>
          <strong>{{ $t('iota.isHealthy') }}</strong>
          {{ nodeInfo.isHealthy }}
        </p>
        <p>
          <strong>{{ $t('iota.networkId') }}</strong>
          {{ nodeInfo.networkId }}
        </p>
        <p>
          <strong>{{ $t('iota.lastMilestoneIndex') }}</strong>
          {{ nodeInfo.latestMilestoneIndex }}
        </p>
        <p>
          <strong>{{ $t('iota.confirmedMilestoneIndex') }}</strong>
          {{ nodeInfo.confirmedMilestoneIndex }}
        </p>
        <p>
          <strong>{{ $t('iota.pruning') }}</strong>
          {{ nodeInfo.pruningIndex }}
        </p>
        <p>
          <strong>{{ $t('iota.features') }}</strong>
          {{ nodeInfo.features }}
        </p>
        <p>
          <strong>{{ $t('iota.minPoWScore') }}</strong>
          {{ nodeInfo.minPoWScore }}
        </p>
      </div>
    </div>
  </div>
</template>
<script>
import CommunityNews from '@/components/Overview/CommunityNews'
import { SingleNodeClient } from '@iota/iota.js'

export default {
  name: 'Overview',
  components: {
    CommunityNews,
  },
  data() {
    return {
      nodeInfo: null,
    }
  },
  methods: {
    async getNodeInfo() {
      const client = new SingleNodeClient('https://chrysalis-nodes.iota.org')

      try {
        const info = await client.info()
        this.nodeInfo = info
      } catch (err) {
        // console.error(err)
      }
    },
  },
  created() {
    // this.getNodeInfo()
  },
}
</script>
