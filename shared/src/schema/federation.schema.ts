import * as v from 'valibot'

// The challenge a request to a peer carries and the peer signs back (RFC 9421 `nonce`): 128 random bits as hex
// a string in and out: it travels in a query, and the peer signs back exactly what it got
export const signatureNonceSchema = v.pipe(v.string(), v.hexadecimal(), v.length(32))
export type SignatureNonce = v.InferOutput<typeof signatureNonceSchema>
