import { url } from 'inspector'
import { z } from 'zod'
import {
  durationSchema,
  nodeCryptoKeyObjectSchema,
  positiveIntegerSchema,
  urlSchema,
  uuidv4Schema,
} from '../schema/base.schema'
import { getPrivateKeyObjekt, getPublicKeyObject } from './JWT'
import { JwtSigner } from './JwtSigner'

export const privateJwtKeySchema = z.string().superRefine((value, ctx) => {
  const privateKeyResult = getPrivateKeyObjekt(value)
  if (!privateKeyResult.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid private key',
    })
  } else if (privateKeyResult.value.asymmetricKeyType !== 'rsa') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Not an RSA private key',
    })
  }
})

export const publicJwtKeySchema = z.string().superRefine((value, ctx) => {
  // getPublicKeyObject (createPublicKey) also accepts a private key and derives the public key from it,
  // but the public key is shared with other communities
  if (getPrivateKeyObjekt(value).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Private key given, expected a public key',
    })
    return
  }
  const publicKeyResult = getPublicKeyObject(value)
  if (!publicKeyResult.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid public key',
    })
  } else if (publicKeyResult.value.asymmetricKeyType !== 'rsa') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Not an RSA public key',
    })
  }
})

export const jwtPayloadSubjectSchema = z.union([uuidv4Schema, z.literal('dlt-connector')])
export type JwtPayloadSubjectInput = z.input<typeof jwtPayloadSubjectSchema>
export type JwtPayloadSubject = z.output<typeof jwtPayloadSubjectSchema>

// jwt schema after https://www.rfc-editor.org/info/rfc7519/#section-4.1 with application specifics rules
export const jwtPayloadSchema = z.object({
  // The "iss" (issuer) claim identifies the principal that issued the
  // JWT.  The processing of this claim is generally application specific.
  // The "iss" value is a case-sensitive string containing a StringOrURI
  // value.  Use of this claim is OPTIONAL.
  // Application specific: mandatory, community server public base url
  iss: urlSchema,

  // The "sub" (subject) claim identifies the principal that is the
  // subject of the JWT.  The claims in a JWT are normally statements
  // about the subject.  The subject value MUST either be scoped to be
  // locally unique in the context of the issuer or be globally unique.
  // The processing of this claim is generally application specific.  The
  // "sub" value is a case-sensitive string containing a StringOrURI
  // value.Use of this claim is OPTIONAL.
  // Application specific: mandatory, depending one jwt token Type user gradido id or community uuid
  sub: jwtPayloadSubjectSchema,

  // The "aud" (audience) claim identifies the recipients that the JWT is
  // intended for.  Each principal intended to process the JWT MUST
  // identify itself with a value in the audience claim.  If the principal
  // processing the claim does not identify itself with a value in the
  // "aud" claim when this claim is present, then the JWT MUST be
  // rejected.  In the general case, the "aud" value is an array of case-
  // sensitive strings, each containing a StringOrURI value.  In the
  // special case when the JWT has one audience, the "aud" value MAY be a
  // single case-sensitive string containing a StringOrURI value.  The
  // interpretation of audience values is generally application specific.
  // Use of this claim is OPTIONAL.
  // Application specific: mandatory, target server base url
  aud: urlSchema,

  // The "exp" (expiration time) claim identifies the expiration time on
  // or after which the JWT MUST NOT be accepted for processing.  The
  // processing of the "exp" claim requires that the current date/time
  // MUST be before the expiration date/time listed in the "exp" claim.
  // Implementers MAY provide for some small leeway, usually no more than
  // a few minutes, to account for clock skew.  Its value MUST be a number
  // containing a NumericDate value.  Use of this claim is OPTIONAL.
  // Application specific: mandatory
  exp: positiveIntegerSchema,

  // The "nbf" (not before) claim identifies the time before which the JWT
  // MUST NOT be accepted for processing.  The processing of the "nbf"
  // claim requires that the current date/time MUST be after or equal to
  // the not-before date/time listed in the "nbf" claim.  Implementers MAY
  // provide for some small leeway, usually no more than a few minutes, to
  // account for clock skew.  Its value MUST be a number containing a
  // NumericDate value.  Use of this claim is OPTIONAL.
  // nbf: positiveIntegerSchema.nullish(),

  // The "iat" (issued at) claim identifies the time at which the JWT was
  // issued.  This claim can be used to determine the age of the JWT.  Its
  // value MUST be a number containing a NumericDate value.  Use of this
  // claim is OPTIONAL.
  iat: positiveIntegerSchema.optional(),

  // The "jti" (JWT ID) claim provides a unique identifier for the JWT.
  // The identifier value MUST be assigned in a manner that ensures that
  // there is a negligible probability that the same value will be
  // accidentally assigned to a different data object; if the application
  // uses multiple issuers, collisions MUST be prevented among values
  // produced by different issuers as well.  The "jti" claim can be used
  // to prevent the JWT from being replayed.  The "jti" value is a case-
  // sensitive string.  Use of this claim is OPTIONAL.
  // Application specific: optional, only used for Non-replayable requests
  jti: uuidv4Schema.nullish(),
})

export type JwtPayloadInput = z.input<typeof jwtPayloadSchema>
export type JwtPayload = z.output<typeof jwtPayloadSchema>

/**
 * What a server needs to create and verify its own tokens.
 * Meant to be built once at startup from the config and then passed to
 * `createFrontendLoginToken` / `verifyFrontendLoginToken`.
 *
 * - `issuer`: public base url of the community server, written as `iss` and `aud`
 *   and expected in both on verification
 * - `signingKey`: key object of any type, each signing function checks for the kind it needs
 *   (`hmacKeyObjectSchema` for HS256)
 * - `duration`: lifetime of a created token
 */
export const authContextSchema = z.object({
  issuer: urlSchema,
  audience: urlSchema,
  duration: durationSchema,
  hash: z.instanceof(JwtSigner),
})

export type AuthContextInput = z.input<typeof authContextSchema>
export type AuthContext = z.output<typeof authContextSchema>
