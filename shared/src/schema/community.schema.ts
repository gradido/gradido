import * as v from 'valibot'
import { privateJwtKeySchema, publicJwtKeySchema } from '../jwt/jwt.schema'
import {
  ed25519PrivateKeySchema,
  ed25519PublicKeySchema,
  urlSchema,
  uuidv4Schema,
} from './base.schema'

export const communityAuthenticatedSchema = v.object({
  communityUuid: uuidv4Schema,
  authenticatedAt: v.date(),
})

export const homeCommunityInsertSchema = v.object({
  foreign: v.optional(v.literal(false), false),
  publicKey: ed25519PublicKeySchema,
  privateKey: ed25519PrivateKeySchema,
  communityUuid: uuidv4Schema,
  url: urlSchema,
  name: v.pipe(v.string(), v.minLength(3), v.maxLength(40)), // TODO: use own community name rules for both config and this
  description: v.pipe(v.string(), v.minLength(10), v.maxLength(255)),
  creationDate: v.date(),
  publicJwtKey: publicJwtKeySchema,
  privateJwtKey: privateJwtKeySchema,
})

export type HomeCommunityInsertInput = v.InferInput<typeof homeCommunityInsertSchema>
