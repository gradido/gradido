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
    <div>
      <hr />
      <div class="h4">blake2b:</div>
      <b-row>
        <b-col>
          <div class="word-break">{{ blake2b }}</div>
        </b-col>
        <b-col></b-col>
      </b-row>
    </div>
    <div>
      <hr />
      <div class="h3">Address Generator</div>
      <button @click="generateAddresses">Generate Addresses</button>
      <div v-for="address in addresses" :key="address.index">
        <h2>Wallet Index {{ address.index }}</h2>
        <p>
          <strong>Private Key:</strong>
          {{ address.privateKey }}
        </p>
        <p>
          <strong>Public Key:</strong>
          {{ address.publicKey }}
        </p>
        <p>
          <strong>Address Ed25519:</strong>
          {{ address.addressEd25519 }}
        </p>
        <p>
          <strong>Address Bech32:</strong>
          {{ address.addressBech32 }}
        </p>
        <hr />
      </div>
    </div>
  </div>
</template>

<script>
import CommunityNews from '@/components/Overview/CommunityNews'
import { Converter } from '@iota/util.js'

import { Bip32Path, Bip39, Blake2b } from '@iota/crypto.js'
import {
  Bech32Helper,
  Ed25519Address,
  Ed25519Seed,
  ED25519_ADDRESS_TYPE,
  generateBip44Address,
  // IOTA_BIP44_BASE_PATH,
  SingleNodeClient,
} from '@iota/iota.js'

const API_ENDPOINT = 'https://chrysalis-nodes.iota.org/'

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
      addresses: [],
    }
  },
  computed: {
    bytesToHex() {
      return Converter.bytesToHex(Converter.utf8ToBytes(this.text))
    },

    blake2b() {
      const sum = Blake2b.sum512(Converter.utf8ToBytes(this.text))

      return this.text === null || this.text === '' ? '' : Converter.bytesToHex(sum)
    },
  },
  methods: {
    async getNodeInfo() {
      const client = new SingleNodeClient(API_ENDPOINT)

      try {
        const info = await client.info()
        this.nodeInfo = info
      } catch (err) {
        this.nodeInfo = err
      }
    },
    async generateAddresses() {
      const client = new SingleNodeClient(API_ENDPOINT)
      const info = await client.info()
      const randomMnemonic = Bip39.randomMnemonic()
      const baseSeed = Ed25519Seed.fromMnemonic(randomMnemonic)
      const addressGeneratorAccountState = {
        accountIndex: 0,
        addressIndex: 0,
        isInternal: false,
      }

      const generatedAddresses = []
      for (let i = 0; i < 6; i++) {
        const path = generateBip44Address(addressGeneratorAccountState)
        const addressSeed = baseSeed.generateSeedFromPath(new Bip32Path(path))
        const addressKeyPair = addressSeed.keyPair()
        const indexEd25519Address = new Ed25519Address(addressKeyPair.publicKey)
        const indexPublicKeyAddress = indexEd25519Address.toAddress()

        generatedAddresses.push({
          index: path,
          privateKey: Converter.bytesToHex(addressKeyPair.privateKey),
          publicKey: Converter.bytesToHex(addressKeyPair.publicKey),
          addressEd25519: Converter.bytesToHex(indexPublicKeyAddress),
          addressBech32: Bech32Helper.toBech32(
            ED25519_ADDRESS_TYPE,
            indexPublicKeyAddress,
            info.bech32HRP,
          ),
        })
      }

      this.addresses = generatedAddresses
    },
  },
  created() {
    this.getNodeInfo()
  },
}
</script>
