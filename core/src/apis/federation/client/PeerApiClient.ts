import { treaty } from '@elysia/eden'
import { peerApiRoutes } from '../server'

export type ElysiaApiRoutesClientType = ReturnType<typeof treaty<typeof peerApiRoutes>>

export class PeerApiClient {
  private elysiaJsClientEncryptSign: ElysiaApiRoutesClientType
  private elysiaJsClient: ElysiaApiRoutesClientType
  public publicJwtKey: string | undefined
  // private sharedSecret:

  public constructor(
    public readonly url: string,
    public readonly publicKey: Buffer,
  ) {
    const self = this
    this.elysiaJsClientEncryptSign = treaty<typeof peerApiRoutes>(url, {
      // @ts-expect-error Bun's typeof fetch requires preconnect, https://github.com/oven-sh/bun/issues/27070
      fetcher: (url, options) => fetch(url, self.preprocessRequest(options)),
    })
    this.elysiaJsClient = treaty<typeof peerApiRoutes>(url)
  }

  protected preprocessRequest(options: RequestInit): RequestInit {
    if (!this.publicJwtKey) {
      throw new Error('Missing publicJwtKey, please set before calling one of: postHandshake1Open')
    }

    return options
  }

  public getCommunityInfos() {
    return this.elysiaJsClient['peer-api'].v1.communityInfos.get()
  }
  public postHandshake1Open(handshakeId: number) {
    return this.elysiaJsClientEncryptSign['peer-api'].v1.handshake1Open.post({ handshakeId })
  }
  public toString(): string {
    return this.url
  }
}
