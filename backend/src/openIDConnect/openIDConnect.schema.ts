// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** What a client needs to find the keys: who issues the tokens and where the keys stand. */
export const openidConfigurationSchema = v.object({
  issuer: v.string(),
  jwks_uri: v.string(),
})

/** One public RSA key of the community as a JWK, named for what it is used with. */
const jwkSchema = v.object({
  kty: v.string(),
  n: v.string(),
  e: v.string(),
  alg: v.picklist(['RS256', 'RSA-OAEP-256']),
  use: v.literal('sig'),
  kid: v.string(),
})

export const jwksSchema = v.object({
  keys: v.array(jwkSchema),
})

/** The part of such a key that says which key it is. */
export type RsaPublicJwk = Pick<v.InferOutput<typeof jwkSchema>, 'kty' | 'n' | 'e'>

export const jwksFailedSchema = v.object({
  error: v.string(),
})
