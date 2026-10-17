import { communityDescriptionSchema, communityNameSchema } from 'config-schema'
import * as v from 'valibot'
import { privateJwtKeySchema, publicJwtKeySchema } from '../jwt/jwt.schema'
import {
  dateSchema,
  dateStringSchema,
  ed25519PrivateKeySchema,
  ed25519PublicKeySchema,
  publicKeyHexStringSchema,
  urlSchema,
  uuidv4Schema,
} from './base.schema'
import { hieroIdSchema } from './typeGuard.schema'

export const communityAuthenticatedSchema = v.object({
  communityUuid: uuidv4Schema,
  authenticatedAt: v.date(),
})

export const communityHandshakeDataSchema = v.object({
  publicKey: ed25519PublicKeySchema,
  publicJwtKey: publicJwtKeySchema,
  url: urlSchema,
})
export type CommunityHandshakeData = v.InferOutput<typeof communityHandshakeDataSchema>

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
})

export type HomeCommunityInsertInput = v.InferInput<typeof homeCommunityInsertSchema>

export const foreignCommunityInsertSchema = v.object({
  foreign: v.optional(v.literal(true), true),
  url: urlSchema,
  publicKey: ed25519PublicKeySchema,
  communityUuid: uuidv4Schema,
  authenticatedAt: dateSchema,
  name: communityNameSchema,
  description: communityDescriptionSchema,
  publicJwtKey: publicJwtKeySchema,
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
  hieroTopicId: v.nullable(hieroIdSchema),
})

export const foreignCommunityInfoSchema = v.object({
  communityUuid: uuidv4Schema,
  name: communityNameSchema,
  description: communityDescriptionSchema,
  creationDate: dateSchema,
  publicKey: ed25519PublicKeySchema,
  publicJwtKey: publicJwtKeySchema,
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
