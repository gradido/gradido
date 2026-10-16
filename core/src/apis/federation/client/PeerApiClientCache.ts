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
  public get(url: string, publicKey: Buffer): PeerApiClient {
    let client = this.peerApiClients.get(url)
    if (!client) {
      client = new PeerApiClient(url, publicKey)
      this.peerApiClients.set(url, client)
    }
    return client
  }
}
