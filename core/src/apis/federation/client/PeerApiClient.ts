import { treaty } from '@elysia/eden'
import { createSignatureNonce, FEDERATION_REQUEST_TIMEOUT_MS, verifySignedResponse } from 'shared'
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
    private readonly timeoutMs = FEDERATION_REQUEST_TIMEOUT_MS,
  ) {
    const self = this
    this.elysiaJsClientEncryptSign = treaty<typeof peerApiRoutes>(url, {
      // @ts-expect-error Bun's typeof fetch requires preconnect, https://github.com/oven-sh/bun/issues/27070
      fetcher: (url, options) => self.fetchInTime(url, self.preprocessRequest(options)),
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
  // The nonce to expect, and the method and path the signature covers, are read from the request
  // that was actually sent.
  protected async fetchVerified(url: RequestInfo | URL, options?: RequestInit): Promise<Response> {
    const requested = {
      method: (url instanceof Request ? url.method : options?.method) ?? 'GET',
      url: url instanceof Request ? url.url : url.toString(),
    }
    const nonce = new URL(requested.url).searchParams.get('nonce')
    if (!nonce) {
      throw new Error(`a public route is requested without nonce: ${url}`)
    }
    const response = await this.fetchInTime(url, options)
    if (!response.ok) {
      return response
    }
    // the timeout covers reading the body, too
    const body = await response.text()
    // throw on error
    await verifySignedResponse(
      { status: response.status, headers: response.headers, body },
      this.publicKey,
      nonce,
      requested,
    )
    return new Response(body, { status: response.status, headers: response.headers })
  }

  // A community that does not answer within timeoutMs is given up: fetch throws a DOMException
  // named 'TimeoutError', which reaches the caller through Eden as { data: null, error: { status: 503 } }.
  // A signal of the caller still aborts the request, too.
  protected fetchInTime(url: RequestInfo | URL, options?: RequestInit): Promise<Response> {
    const timeout = AbortSignal.timeout(this.timeoutMs)
    const signal = options?.signal ? AbortSignal.any([options.signal, timeout]) : timeout
    return fetch(url, { ...options, signal })
  }

  protected preprocessRequest(options: RequestInit): RequestInit {
    if (!this.publicJwtKey) {
      throw new Error('Missing publicJwtKey, please set before calling one of: postHandshake1Open')
    }

    return options
  }

  public getCommunityInfos() {
    return this.elysiaJsClient['peer-api'].v1.communityInfos.get({
      query: { nonce: createSignatureNonce() },
    })
  }

  public toString(): string {
    return this.url
  }
}
