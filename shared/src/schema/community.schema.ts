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

export const communityInfoWireSchema = v.object({
  name: communityNameSchema,
  description: communityDescriptionSchema,
  creationDate: dateStringSchema,
  publicKey: publicKeyHexStringSchema,
  publicJwtKey: publicJwtKeySchema,
  hieroTopicId: hieroIdSchema,
})

export const foreignCommunityInfoSchema = v.object({
  name: communityNameSchema,
  description: communityDescriptionSchema,
  creationDate: dateSchema,
  publicKey: ed25519PublicKeySchema,
  publicJwtKey: publicJwtKeySchema,
  hieroTopicId: hieroIdSchema,
})

export type ForeignCommunityInfo = v.InferOutput<typeof foreignCommunityInfoSchema>
