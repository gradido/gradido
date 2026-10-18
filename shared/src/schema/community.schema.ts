import { communityDescriptionSchema, communityNameSchema } from 'config-schema'
import * as v from 'valibot'
import { privateJwtKeySchema, publicJwtKeySchema } from '../jwt/jwt.schema'
import {
  dateSchema,
  dateStringSchema,
  ed25519PrivateKeySchema,
  ed25519PublicKeySchema,
  locationPointSchema,
  publicKeyHexStringSchema,
  urlSchema,
  uuidv4Schema,
  x25519PrivateKeySchema,
  x25519PublicKeySchema,
} from './base.schema'
import { hieroIdSchema } from './typeGuard.schema'

export const homeCommunityInsertSchema = v.object({
  foreign: v.optional(v.literal(false), false),
  publicKey: ed25519PublicKeySchema,
  privateKey: ed25519PrivateKeySchema,
  communityUuid: uuidv4Schema,
  url: urlSchema,
  name: communityNameSchema,
  description: v.pipe(v.string(), v.minLength(10), v.maxLength(255)),
  creationDate: v.date(),
  publicJwtKey: publicJwtKeySchema,
  privateJwtKey: privateJwtKeySchema,
  publicEncryptionKey: x25519PublicKeySchema,
  privateEncryptionKey: x25519PrivateKeySchema,
})

export type HomeCommunityInsertInput = v.InferInput<typeof homeCommunityInsertSchema>

/**
 * What may change on the existing home community, each field optional. Its keys, its uuid and
 * its creation date are not in here: they are set once, on insert, and every process holds the
 * keys from its start on. A field that is not in here is dropped by the parse.
 */
export const homeCommunityUpdateSchema = v.partial(
  v.object({
    url: homeCommunityInsertSchema.entries.url,
    name: homeCommunityInsertSchema.entries.name,
    description: homeCommunityInsertSchema.entries.description,
    gmsApiKey: v.nullable(v.string()),
    // a point without coordinates is how Location2Point writes "no position"
    location: v.nullable(
      v.object({
        type: locationPointSchema.entries.type,
        coordinates: v.union([
          locationPointSchema.entries.coordinates,
          v.pipe(v.array(v.number()), v.length(0)),
        ]),
      }),
    ),
    hieroTopicId: v.nullable(hieroIdSchema),
    matchingKeyingActive: v.boolean(),
  }),
)

export type HomeCommunityUpdateInput = v.InferInput<typeof homeCommunityUpdateSchema>

export const foreignCommunityInsertSchema = v.object({
  foreign: v.optional(v.literal(true), true),
  url: urlSchema,
  publicKey: ed25519PublicKeySchema,
  communityUuid: uuidv4Schema,
  authenticatedAt: dateSchema,
  name: communityNameSchema,
  description: communityDescriptionSchema,
  publicJwtKey: publicJwtKeySchema,
  publicEncryptionKey: x25519PublicKeySchema,
  hieroTopicId: v.nullable(hieroIdSchema),
  creationDate: dateSchema,
  updatedAt: dateSchema,
})

export type ForeignCommunityInsertInput = v.InferInput<typeof foreignCommunityInsertSchema>
export type ForeignCommunityInsert = v.InferOutput<typeof foreignCommunityInsertSchema>

// TODO: check if we can make only one schema instead two: communityInfoWireSchema + foreignCommunityInfoSchema

export const communityInfoWireSchema = v.object({
  communityUuid: uuidv4Schema,
  name: communityNameSchema,
  description: communityDescriptionSchema,
  creationDate: dateStringSchema,
  publicKey: publicKeyHexStringSchema,
  publicJwtKey: publicJwtKeySchema,
  publicEncryptionKey: publicKeyHexStringSchema,
  hieroTopicId: v.nullable(hieroIdSchema),
})

export const foreignCommunityInfoSchema = v.object({
  communityUuid: uuidv4Schema,
  name: communityNameSchema,
  description: communityDescriptionSchema,
  creationDate: dateSchema,
  publicKey: ed25519PublicKeySchema,
  publicJwtKey: publicJwtKeySchema,
  publicEncryptionKey: x25519PublicKeySchema,
  hieroTopicId: v.nullable(hieroIdSchema),
})

export type ForeignCommunityInfo = v.InferOutput<typeof foreignCommunityInfoSchema>

export const foreignCommunityUpdatesSchema = v.object({
  name: foreignCommunityInfoSchema.entries.name,
  description: foreignCommunityInfoSchema.entries.description,
  hieroTopicId: foreignCommunityInfoSchema.entries.hieroTopicId,
  updatedAt: dateSchema,
})

export type ForeignCommunityUpdatesInput = v.InferInput<typeof foreignCommunityUpdatesSchema>
