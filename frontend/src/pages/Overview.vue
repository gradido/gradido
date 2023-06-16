<template>
  <div class="overview">
    <community-news />
    <div class="card mt-5">
      <button @click="getNodeInfo">Get Iota Node Info</button>
      <div v-if="nodeInfo">
        <h2>Node Info</h2>
        <p>
          <strong>Name:</strong>
          {{ nodeInfo.name }}
        </p>
        <p>
          <strong>Version:</strong>
          {{ nodeInfo.version }}
        </p>
        <p>
          <strong>Is Healthy:</strong>
          {{ nodeInfo.isHealthy }}
        </p>
        <p>
          <strong>Network Id:</strong>
          {{ nodeInfo.networkId }}
        </p>
        <p>
          <strong>Latest Milestone Index:</strong>
          {{ nodeInfo.latestMilestoneIndex }}
        </p>
        <p>
          <strong>Confirmed Milestone Index:</strong>
          {{ nodeInfo.confirmedMilestoneIndex }}
        </p>
        <p>
          <strong>Pruning Index:</strong>
          {{ nodeInfo.pruningIndex }}
        </p>
        <p>
          <strong>Features:</strong>
          {{ nodeInfo.features }}
        </p>
        <p>
          <strong>Min PoW Score:</strong>
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
        console.error(err)
      }
    },
  },
  created() {
    // this.getNodeInfo()
  },
}
</script>
