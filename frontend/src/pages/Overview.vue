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
    <div>
      <hr />
      <div class="h4">bytesToHex:</div>
      <b-row>
        <b-col>
          <div>{{ bytesToHex }}</div>
        </b-col>
        <b-col>
          <b-form inline>
            <label class="sr-only" for="inline-form-input-text">Text</label>
            <b-form-input
              v-model="text"
              id="inline-form-input-text"
              class="mb-2 mr-sm-2 mb-sm-0"
              placeholder="Jane Doe"
            ></b-form-input>
          </b-form>
        </b-col>
      </b-row>
    </div>
  </div>
</template>
<script>
import CommunityNews from '@/components/Overview/CommunityNews'
import { SingleNodeClient } from '@iota/iota.js'
import { Converter } from '@iota/util.js'


const bytes = Converter.utf8ToBytes('Hello World')

const hex = Converter.bytesToHex(bytes)

alert(hex)

export default {
  name: 'Overview',
  components: {
    CommunityNews,
  },
  data() {
    return {
      text: '',
      nodeInfo: null,
      nodeHealth: null,
    }
  },
  computed: {
    bytesToHex() {
      const bytes = Converter.utf8ToBytes(this.text)

      return Converter.bytesToHex(bytes)
    },
  },
  methods: {
    async getNodeInfo() {
      const client = new SingleNodeClient('https://chrysalis-nodes.iota.org')

      try {
        const info = await client.info()
        this.nodeInfo = info

        const health = await client.health()
        console.log('Is the node healthy', health ? 'Yes' : 'No')
        console.log()

        // const output = await client.output('4752414449444f3a205465737448656c6c6f57656c7431')
        // console.log('Output')
        // console.log('\tMessage Id:', output.messageId)
        // console.log('\tTransaction Id:', output.transactionId)
        // console.log('\tOutput Index:', output.outputIndex)
        // console.log('\tIs Spent:', output.isSpent)
        // logOutput('\t', output.output)
        // console.log()
      } catch (err) {
        // console.error(err)
        this.nodeInfo = err
      }
    },
  },
  created() {
    // this.getNodeInfo()
  },
}
</script>
