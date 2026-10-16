import { treaty } from '@elysia/eden'
import { verifySignedResponse } from 'shared'
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
    this.elysiaJsClient = treaty<typeof peerApiRoutes>(url, {
      // @ts-expect-error Bun's typeof fetch requires preconnect, https://github.com/oven-sh/bun/issues/27070
      fetcher: (url, options) => self.fetchVerified(url, options),
    })
  }

  // A public route answers signed by the community (RFC 9421). A successful answer that does not
  // verify against the announced public key is refused: the throw reaches the caller through Eden
  // as { data: null, error: { status: 503, value: InvalidResponseSignatureError } }.
  // Error answers are not signed and carry no data, they pass as they are.
  protected async fetchVerified(url: RequestInfo | URL, options?: RequestInit): Promise<Response> {
    const response = await fetch(url, options)
    if (!response.ok) {
      return response
    }
    const body = await response.text()
    // throw on error
    await verifySignedResponse(
      { status: response.status, headers: response.headers, body },
      this.publicKey,
    )
    return new Response(body, { status: response.status, headers: response.headers })
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
