import { z } from 'zod'
import { privateJwtKeySchema, publicJwtKeySchema } from '../jwt'
import {
  ed25519PrivateKeySchema,
  ed25519PublicKeySchema,
  urlSchema,
  uuidv4Schema,
} from './base.schema'

export const communityAuthenticatedSchema = z.object({
  communityUuid: uuidv4Schema,
  authenticatedAt: z.date(),
})

export const homeCommunityInsertSchema = z.object({
  foreign: z.literal(false).default(false),
  publicKey: ed25519PublicKeySchema,
  privateKey: ed25519PrivateKeySchema,
  communityUuid: uuidv4Schema,
  url: urlSchema,
  name: z.string().min(3).max(40), // TODO: use own community name rules for both config and this
  description: z.string().min(10).max(255),
  creationDate: z.date(),
  publicJwtKey: publicJwtKeySchema,
  privateJwtKey: privateJwtKeySchema,
})

export type HomeCommunityInsertInput = z.input<typeof homeCommunityInsertSchema>
