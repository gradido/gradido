import * as v from 'valibot'
import { dateSchema, ed25519PublicKeySchema, positiveIntegerSchema } from './base.schema'

export const federationApiSchema = v.optional(
  v.pipe(v.picklist(['1_0', '1_1']), v.description('Federation API version, defaults to 1_0')),
  '1_0',
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
    updatedAt: dateSchema,
  }),
  v.transform((input) => ({
    ...input,
    // TEMP: while refactore federation api, in target version, this will be stored in db and validated with v.pipe(v.string(), v.url())
    apiUrl: `${input.endPoint.slice(0, input.endPoint.lastIndexOf('api/'))}/peer-api/${input.apiVersion === '1_0' ? '1' : '2'}`,
  })),
)

export type FederatedCommunity = v.InferOutput<typeof federatedCommunitySchema>
