import { Ed25519KeyPair } from 'shared-native'
import { PeerApiClient } from './PeerApiClient'

// TODO: create app context and put this into it
export class PeerApiClientCache {
  // Singleton stuff
  static #instance: PeerApiClientCache | undefined = undefined

  static getInstance(): PeerApiClientCache {
    if (!PeerApiClientCache.#instance) {
      PeerApiClientCache.#instance = new PeerApiClientCache()
    }
    return PeerApiClientCache.#instance
  }

  private peerApiClients: Map<string, PeerApiClient>
  private constructor() {
    this.peerApiClients = new Map<string, PeerApiClient>()
  }
  // url: the federation endpoint as announced, e.g. `https://host/api/`; the peer api lives beside it
  public get(url: string, keyPair: Ed25519KeyPair): PeerApiClient {
    // TEMP: while refactoring the federation api, the endpoint is still the graphql one
    const apiIndex = url.lastIndexOf('api/')
    const baseUrl = apiIndex > 0 ? url.slice(0, apiIndex) : url
    let client = this.peerApiClients.get(baseUrl)
    // another community now answers at that url
    if (!client || !client.keyPair.equals(keyPair)) {
      client = new PeerApiClient(baseUrl, keyPair)
      this.peerApiClients.set(baseUrl, client)
    }
    return client
  }
}
