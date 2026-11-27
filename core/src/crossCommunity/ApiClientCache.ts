// TODO: create app context and put this into it

import { CommunitiesSelect, dbFindForeignCommunityByPublicKey } from 'database'
import { PublicKeyHex } from 'shared'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
import { ApiClient, ApiClientCompleted } from './ApiClient'

// A client nobody used for this long goes. A peer that announces itself and is never accepted
// leaves no client behind; one in use stays, and a client that went is built anew when needed.
export const UNUSED_CLIENT_TIMEOUT_MS = 10 * 60 * 1000

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

  private apiClients = new Map<string, { client: ApiClient; lastUsedAt: number }>()
  private constructor() {}

  // the client of this key, unless it went unused for too long; asking for it counts as use
  private use(publicKeyHex: string): ApiClient | undefined {
    const entry = this.apiClients.get(publicKeyHex)
    if (!entry) {
      return undefined
    }
    const now = Date.now()
    if (now - entry.lastUsedAt >= UNUSED_CLIENT_TIMEOUT_MS) {
      this.apiClients.delete(publicKeyHex)
      return undefined
    }
    entry.lastUsedAt = now
    return entry.client
  }

  // a new client, and away with the ones gone unused: the map grows only with new peers
  private store(publicKeyHex: string, client: ApiClient): void {
    const now = Date.now()
    for (const [key, { lastUsedAt }] of this.apiClients) {
      if (now - lastUsedAt >= UNUSED_CLIENT_TIMEOUT_MS) {
        this.apiClients.delete(key)
      }
    }
    this.apiClients.set(publicKeyHex, { client, lastUsedAt: now })
  }

  // url: the federation endpoint as announced, e.g. `https://host/api/`; the peer api lives beside it
  public getByUrl(
    url: string,
    keyPair: Ed25519KeyPair,
    encryptionKeyPair?: X25519KeyPair,
  ): ApiClient {
    const publicKeyHex = keyPair.publicKeyToHex()
    let client = this.use(publicKeyHex)
    const apiIndex = url.lastIndexOf('api/')
    const baseUrl = apiIndex > 0 ? url.slice(0, apiIndex) : url
    // another community now answers at that url
    if (!client || baseUrl !== client.url) {
      client = new ApiClient(baseUrl, keyPair, encryptionKeyPair)
      this.store(publicKeyHex, client)
    }
    return client
  }

  public get(foreignCommunity: CommunitiesSelect): ApiClientCompleted {
    let client = this.use(foreignCommunity.publicKey.toString('hex'))
    if (!client) {
      client = this.getByUrl(foreignCommunity.url, new Ed25519KeyPair(foreignCommunity.publicKey))
    }
    if (
      !client.publicEncryptionKey &&
      foreignCommunity.publicEncryptionKey &&
      foreignCommunity.publicEncryptionKey.byteLength > 0
    ) {
      client.publicEncryptionKey = new X25519KeyPair(foreignCommunity.publicEncryptionKey)
    }
    if (!client.communityUuid) {
      client.communityUuid = foreignCommunity.communityUuid
    }

    return client as ApiClientCompleted
  }

  public async getByPublicKeyHex(
    publicKeyHex: PublicKeyHex,
  ): Promise<ApiClientCompleted | undefined> {
    let client = this.use(publicKeyHex)
    if (!client || !client.publicEncryptionKey || !client.communityUuid) {
      const com = await dbFindForeignCommunityByPublicKey(Buffer.from(publicKeyHex, 'hex'))
      if (com && com.authenticatedAt) {
        // TODO: Move into extra function if it get's a third user
        client = this.getByUrl(com.url, new Ed25519KeyPair(com.publicKey))
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
