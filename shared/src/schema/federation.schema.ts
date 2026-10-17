import * as v from 'valibot'
import { dateSchema, ed25519PublicKeySchema, positiveIntegerSchema } from './base.schema'

// The challenge a request to a peer carries and the peer signs back (RFC 9421 `nonce`): 128 random bits as hex
// a string in and out: it travels in a query, and the peer signs back exactly what it got
export const signatureNonceSchema = v.pipe(v.string(), v.hexadecimal(), v.length(32))

export const federationApiVersions = ['1_0', '1_1']

export const federationApiSchema = v.optional(
  v.pipe(
    v.picklist(federationApiVersions),
    v.description('Federation API version, defaults to 1_0'),
  ),
  federationApiVersions[0],
)
// TODO: Move into community
// TODO: Target structure for optimized federated communities table
export const federatedCommunitySchema = v.pipe(
  v.object({
    id: positiveIntegerSchema,
    publicKey: ed25519PublicKeySchema,
    apiVersion: federationApiSchema,
    // TODO narrow down type
    // TEMP: while refactore federation api
    endPoint: v.pipe(
      v.string(),
      v.custom(
        (input) => typeof input === 'string' && input.lastIndexOf('api/') > 0,
        'Invalid federation endpoint',
      ),
    ),
    lastAnnouncedAt: dateSchema,
    verifiedAt: v.nullable(dateSchema),
    lastErrorAt: v.nullable(dateSchema),
    createdAt: dateSchema,
    updatedAt: v.nullable(dateSchema),
  }),
)

export type FederatedCommunity = v.InferOutput<typeof federatedCommunitySchema>
