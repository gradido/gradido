import * as v from 'valibot'
import {
  durationSchema,
  positiveIntegerSchema,
  urlSchema,
  uuidv4Schema,
} from '../schema/base.schema'
import { getPrivateKeyObjekt, getPublicKeyObject } from './JWT'
import { JwtSigner } from './JwtSigner'

export const privateJwtKeySchema = v.pipe(
  v.string(),
  v.rawCheck(({ dataset, addIssue }) => {
    if (!dataset.typed) {
      return
    }
    const privateKeyResult = getPrivateKeyObjekt(dataset.value)
    if (!privateKeyResult.success) {
      addIssue({ message: 'Invalid private key' })
    } else if (privateKeyResult.value.asymmetricKeyType !== 'rsa') {
      addIssue({ message: 'Not an RSA private key' })
    }
  }),
)

export const publicJwtKeySchema = v.pipe(
  v.string(),
  v.rawCheck(({ dataset, addIssue }) => {
    if (!dataset.typed) {
      return
    }
    // getPublicKeyObject (createPublicKey) also accepts a private key and derives the public key from it,
    // but the public key is shared with other communities
    if (getPrivateKeyObjekt(dataset.value).success) {
      addIssue({ message: 'Private key given, expected a public key' })
      return
    }
    const publicKeyResult = getPublicKeyObject(dataset.value)
    if (!publicKeyResult.success) {
      addIssue({ message: 'Invalid public key' })
    } else if (publicKeyResult.value.asymmetricKeyType !== 'rsa') {
      addIssue({ message: 'Not an RSA public key' })
    }
  }),
)

// whom a token names: a user by gradido id, or the dlt-connector as the one service with a login
export const jwtPayloadSubjectSchema = v.union([uuidv4Schema, v.literal('dlt-connector')])
export type JwtPayloadSubjectInput = v.InferInput<typeof jwtPayloadSubjectSchema>
export type JwtPayloadSubject = v.InferOutput<typeof jwtPayloadSubjectSchema>

// jwt schema after https://www.rfc-editor.org/info/rfc7519/#section-4.1 with application specifics rules
export const jwtPayloadSchema = v.object({
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
  // nbf: v.nullish(positiveIntegerSchema),

  // The "iat" (issued at) claim identifies the time at which the JWT was
  // issued.  This claim can be used to determine the age of the JWT.  Its
  // value MUST be a number containing a NumericDate value.  Use of this
  // claim is OPTIONAL.
  iat: v.optional(positiveIntegerSchema),

  // The "jti" (JWT ID) claim provides a unique identifier for the JWT.
  // The identifier value MUST be assigned in a manner that ensures that
  // there is a negligible probability that the same value will be
  // accidentally assigned to a different data object; if the application
  // uses multiple issuers, collisions MUST be prevented among values
  // produced by different issuers as well.  The "jti" claim can be used
  // to prevent the JWT from being replayed.  The "jti" value is a case-
  // sensitive string.  Use of this claim is OPTIONAL.
  // Application specific: optional, only used for Non-replayable requests
  jti: v.nullish(uuidv4Schema),
})

export type JwtPayloadInput = v.InferInput<typeof jwtPayloadSchema>
export type JwtPayload = v.InferOutput<typeof jwtPayloadSchema>

/**
 * What a server needs to create and verify its own tokens of one purpose.
 * Meant to be built once at startup from the config, one per purpose, and then passed to
 * `createUserToken` / `verifyUserToken`.
 *
 * - `issuer`: public base url of the community server, written as `iss` and expected on verification
 * - `audience`: url of the part of the server that evaluates the token, written as `aud` and
 *   expected on verification. Give every purpose its own, it is what keeps their tokens apart
 * - `duration`: lifetime of a created token
 * - `signer`: it carries secret and signing type
 */
export const authContextSchema = v.object({
  issuer: urlSchema,
  audience: urlSchema,
  duration: durationSchema,
  signer: v.instance(JwtSigner),
})

export type AuthContextInput = v.InferInput<typeof authContextSchema>
export type AuthContext = v.InferOutput<typeof authContextSchema>
