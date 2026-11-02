import { dbFindForeignCommunityByPublicKey } from 'database'
import { PublicKeyHex } from 'shared'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
import { ApiClient, ApiClientCompleted } from './ApiClient'

// TODO: create app context and put this into it
// TODO: Think about ApiClient Timeout/Reload
export class ApiClientCache {
  // Singleton stuff
  static #instance: ApiClientCache | undefined = undefined

  static getInstance(): ApiClientCache {
    if (!ApiClientCache.#instance) {
      ApiClientCache.#instance = new ApiClientCache()
    }
    return ApiClientCache.#instance
  }

  private apiClients: Map<PublicKeyHex, ApiClient>
  private constructor() {
    this.apiClients = new Map<PublicKeyHex, ApiClient>()
  }
  // url: the federation endpoint as announced, e.g. `https://host/api/`; the peer api lives beside it
  public get(url: string, keyPair: Ed25519KeyPair): ApiClient {
    const publicKeyHex = keyPair.publicKeyToHex()
    let client = this.apiClients.get(publicKeyHex)
    const apiIndex = url.lastIndexOf('api/')
    const baseUrl = apiIndex > 0 ? url.slice(0, apiIndex) : url
    // another community now answers at that url
    if (!client || baseUrl !== client.url) {
      client = new ApiClient(baseUrl, keyPair)
      this.apiClients.set(publicKeyHex, client)
    }
    return client
  }

  public async getByPublicKeyHex(
    publicKeyHex: PublicKeyHex,
  ): Promise<ApiClientCompleted | undefined> {
    let client = this.apiClients.get(publicKeyHex)
    if (!client || !client.publicEncryptionKey || !client.communityUuid) {
      const com = await dbFindForeignCommunityByPublicKey(Buffer.from(publicKeyHex, 'hex'))
      if (com && com.authenticatedAt) {
        client = this.get(com.url, new Ed25519KeyPair(com.publicKey))
        if (com.publicEncryptionKey && com.publicEncryptionKey.byteLength > 0) {
          client.publicEncryptionKey = new X25519KeyPair(com.publicEncryptionKey)
        }
        client.communityUuid = com.communityUuid
      } else {
        return
      }
    }
    if (client) {
      return client as ApiClientCompleted
    }
  }
}
