import { Ed25519KeyPair } from 'shared-native'
import { ApiClient } from './ApiClient'

// TODO: create app context and put this into it
export class ApiClientCache {
  // Singleton stuff
  static #instance: ApiClientCache | undefined = undefined

  static getInstance(): ApiClientCache {
    if (!ApiClientCache.#instance) {
      ApiClientCache.#instance = new ApiClientCache()
    }
    return ApiClientCache.#instance
  }

  private apiClients: Map<string, ApiClient>
  private constructor() {
    this.apiClients = new Map<string, ApiClient>()
  }
  // url: the federation endpoint as announced, e.g. `https://host/api/`; the peer api lives beside it
  public get(url: string, keyPair: Ed25519KeyPair): ApiClient {
    // TEMP: while refactoring the federation api, the endpoint is still the graphql one
    const apiIndex = url.lastIndexOf('api/')
    const baseUrl = apiIndex > 0 ? url.slice(0, apiIndex) : url
    let client = this.apiClients.get(baseUrl)
    // another community now answers at that url
    if (!client || !client.keyPair.equals(keyPair)) {
      client = new ApiClient(baseUrl, keyPair)
      this.apiClients.set(baseUrl, client)
    }
    return client
  }
}
