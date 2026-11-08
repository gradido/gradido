import { randomBytes } from 'node:crypto'

import { treaty } from '@elysia/eden'
import { appendSignature, FieldOccurrence } from 'http-message-sig'
import {
  AppContext,
  FEDERATION_REQUEST_TIMEOUT_MS,
  InvalidResponseSignatureError,
  SignatureNonce,
  signHttpMessage,
  Uuidv4,
  verifyHttpMessage,
} from 'shared'
import { Ed25519KeyPair, hashGenericBase64, X25519KeyPair } from 'shared-native'
import * as v from 'valibot'
import { apiRoutes } from './apiRoutes'
import { CrossGroupTransactionWireInput, crossGroupTransactionWireSchema } from './schema'

export type ElysiaApiRoutesClientType = ReturnType<typeof treaty<typeof apiRoutes>>
type FetchOptions = {
  signRequest: boolean
  verifyResponse: boolean
  encryptRequest: boolean
  decryptResponse: boolean
}

export class ApiClient {
  private encryptSignVerifyDecryptClient: ElysiaApiRoutesClientType
  private encryptSignClient: ElysiaApiRoutesClientType
  private signVerifyClient: ElysiaApiRoutesClientType
  private verifyClient: ElysiaApiRoutesClientType
  private encryptSignVerifyClient: ElysiaApiRoutesClientType

  public communityUuid: Uuidv4 | undefined

  /** keyPair: the announced public key; every signed answer is verified against it */
  public constructor(
    public readonly url: string,
    public readonly keyPair: Ed25519KeyPair,
    /** the announced X25519 key of the community, a sealed request is encrypted for it */
    public publicEncryptionKey?: X25519KeyPair,
    private readonly timeoutMs = FEDERATION_REQUEST_TIMEOUT_MS,
  ) {
    this.encryptSignVerifyDecryptClient = treaty<typeof apiRoutes>(
      url,
      // @ts-expect-error Bun's typeof fetch requires preconnect, https://github.com/oven-sh/bun/issues/27070
      this.fetchWrapper({
        signRequest: true,
        verifyResponse: true,
        encryptRequest: true,
        decryptResponse: true,
      }),
    )
    this.encryptSignClient = treaty<typeof apiRoutes>(
      url,
      // @ts-expect-error Bun's typeof fetch requires preconnect, https://github.com/oven-sh/bun/issues/27070
      this.fetchWrapper({
        signRequest: true,
        verifyResponse: false,
        encryptRequest: true,
        decryptResponse: false,
      }),
    )
    this.encryptSignVerifyClient = treaty<typeof apiRoutes>(
      url,
      // @ts-expect-error Bun's typeof fetch requires preconnect, https://github.com/oven-sh/bun/issues/27070
      this.fetchWrapper({
        signRequest: true,
        verifyResponse: true,
        encryptRequest: true,
        decryptResponse: false,
      }),
    )
    this.signVerifyClient = treaty<typeof apiRoutes>(
      url,
      // @ts-expect-error Bun's typeof fetch requires preconnect, https://github.com/oven-sh/bun/issues/27070
      this.fetchWrapper({
        signRequest: true,
        verifyResponse: true,
        encryptRequest: false,
        decryptResponse: false,
      }),
    )
    this.verifyClient = treaty<typeof apiRoutes>(
      url,
      // @ts-expect-error Bun's typeof fetch requires preconnect, https://github.com/oven-sh/bun/issues/27070
      this.fetchWrapper({
        signRequest: false,
        verifyResponse: true,
        encryptRequest: false,
        decryptResponse: false,
      }),
    )
  }

  private fetchWrapper(fetchOptions: FetchOptions) {
    return {
      fetcher: (url: RequestInfo | URL, options?: RequestInit) =>
        this.fetcher(fetchOptions, url, options),
    }
  }

  private async fetcher(fetchOptions: FetchOptions, url: RequestInfo | URL, options?: RequestInit) {
    if (fetchOptions.encryptRequest && !fetchOptions.signRequest) {
      throw new Error('can only encrypt request reliable if it is also signed')
    }
    if (fetchOptions.decryptResponse && !fetchOptions.verifyResponse) {
      throw new Error('can only decrypt response reliable if it is also verified')
    }
    if (!options) {
      throw new Error('Missing options')
    }
    let headers = new Headers(options.headers)
    let body = options.body
    let nonce: SignatureNonce | undefined
    if (fetchOptions.signRequest) {
      nonce = randomBytes(16).toString('hex')
      const prepared = await this.preprocessRequest(
        url.toString(),
        options.method,
        headers,
        nonce,
        body,
        fetchOptions.encryptRequest,
      )
      headers = prepared.headers
      body = prepared.body
    }
    // A community that does not answer within timeoutMs is given up: fetch throws a DOMException
    // named 'TimeoutError', which reaches the caller through Eden as { data: null, error: { status: 503 } }.
    // A signal of the caller still aborts the request, too.
    const timeout = AbortSignal.timeout(this.timeoutMs)
    const signal = options?.signal ? AbortSignal.any([options.signal, timeout]) : timeout
    const request = new Request(url, { ...options, signal, headers, body })
    const response = await fetch(request)
    if (!fetchOptions.verifyResponse || !response.ok) {
      return response
    }
    return this.postprocessResponse(response, request, nonce, fetchOptions.decryptResponse)
  }

  // Signs the request with the key of the home community (RFC 9421). With encrypt, the body is
  // encrypted for the community first, and the digest covers it as it goes over the wire.
  protected async preprocessRequest(
    url: string,
    method: string = 'GET',
    headers: Headers,
    nonce: SignatureNonce,
    body: string | BodyInit | null | undefined,
    encrypt: boolean = false,
  ): Promise<{ headers: Headers; body: BodyInit | undefined | null }> {
    if (body && headers.get('content-type') !== 'application/json') {
      throw new Error('Expect body in json format')
    }

    if (body && typeof body !== 'string') {
      throw new Error('Expect body in string format')
    }
    let contentHash: string | undefined
    if (encrypt) {
      if (!body || !this.publicEncryptionKey) {
        throw new Error(`empty body or missing public encryption key`)
      }
      const { box, hash } = AppContext.getInstance()
        .getHomeCommunity()
        .encryptAndHash(body, this.publicEncryptionKey)
      contentHash = hash

      // create view to existing buffer
      body = new Uint8Array(box.buffer as ArrayBuffer, box.byteOffset, box.byteLength)
      headers.set('content-type', 'application/octet-stream')
    } else if (body) {
      contentHash = hashGenericBase64(body)
    }
    if (contentHash) {
      headers.set('content-digest', `blake2b-256=:${contentHash}:`)
    }

    const message = {
      kind: 'request' as const,
      method,
      targetUri: url,
      fields: [] as FieldOccurrence[],
    }
    headers.forEach((value, name) => message.fields.push({ name, value }))
    const signatures = await signHttpMessage(message, nonce)
    return { headers: appendSignature(headers, signatures), body }
  }

  protected async postprocessResponse(
    response: Response,
    request: Request,
    nonce?: SignatureNonce,
    decrypt: boolean = false,
  ): Promise<Response> {
    if (!response.body) {
      throw new Error('Missing Body')
    }
    const message = {
      kind: 'response' as const,
      status: response.status,
      fields: [] as FieldOccurrence[],
      request,
    }
    response.headers.forEach((value, name) => message.fields.push({ name, value }))
    const { keyId } = await verifyHttpMessage(message, nonce)
    if (keyId !== this.keyPair.publicKeyToHex()) {
      throw new InvalidResponseSignatureError('Wrong signer')
    }
    const bodyRaw = await response.arrayBuffer()
    let finalBody: ArrayBuffer | string = bodyRaw
    let contentHash: string | undefined
    // decrypt body if necessary
    if (decrypt) {
      if (!this.publicEncryptionKey) {
        throw new Error('Missing Foreign Community Encryption Key')
      }
      const result = AppContext.getInstance()
        .getHomeCommunity()
        .decryptAndHash(new Uint8Array(bodyRaw), this.publicEncryptionKey)
      if (!result.success) {
        throw result.error
      }
      contentHash = result.value.hash
      // set decrypted body
      finalBody = result.value.payload
    } else if (bodyRaw.byteLength) {
      contentHash = hashGenericBase64(new Uint8Array(bodyRaw))
    }
    // the signature covers the digest header only, the body is bound by comparing it here
    if (
      (!contentHash && bodyRaw.byteLength) ||
      response.headers.get('content-digest') !== `blake2b-256=:${contentHash}:`
    ) {
      throw new InvalidResponseSignatureError('content-digest does not match the body')
    }
    if (!response.headers.has('signature') && !response.headers.has('signature-input')) {
      throw new InvalidResponseSignatureError('response is not signed')
    }

    // reset body to response, after consume it with call to arrayBuffer
    return new Response(finalBody, {
      status: response.status,
      headers: { 'content-type': 'application/json' },
    })
  }

  public getCommunityInfos(exchangeId: SignatureNonce) {
    return this.verifyClient['peer-api'].v1.communityInfos.get({
      query: { exchangeId },
    })
  }

  public prepareSendCoins(tx: CrossGroupTransactionWireInput) {
    return this.encryptSignVerifyDecryptClient['peer-api'].v1.prepareSendCoins.post(
      v.parse(crossGroupTransactionWireSchema, tx),
    )
  }

  public revertSendCoins(tx: CrossGroupTransactionWireInput) {
    return this.encryptSignVerifyClient['peer-api'].v1.revertSendCoins.post(
      v.parse(crossGroupTransactionWireSchema, tx),
    )
  }

  public revertSettledSendCoins(tx: CrossGroupTransactionWireInput) {
    return this.encryptSignVerifyClient['peer-api'].v1.revertSettledSendCoins.post(
      v.parse(crossGroupTransactionWireSchema, tx),
    )
  }

  public settleSendCoins(tx: CrossGroupTransactionWireInput) {
    return this.encryptSignVerifyClient['peer-api'].v1.settleSendCoins.post(
      v.parse(crossGroupTransactionWireSchema, tx),
    )
  }

  public emailTransactionReceived(tx: CrossGroupTransactionWireInput) {
    return this.encryptSignVerifyClient['peer-api'].v1.emailTransactionReceived.post(
      v.parse(crossGroupTransactionWireSchema, tx),
    )
  }

  public toString(): string {
    return this.url
  }
}

export class ApiClientCompleted extends ApiClient {
  public publicEncryptionKey: X25519KeyPair
  public communityUuid: Uuidv4
}
