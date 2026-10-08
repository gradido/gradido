# shared
Gradido Shared Code, Low-Level Shared Code, without dependencies on other modules

## Bun-Compatibility
Full bun compatible

## Enums
All enums used across more than one module

## Schemas
All schemas for data validation used across more than one module
Tests written for bun

## JWT
`src/jwt` holds two independent implementations:

- `JWT.ts`: asymmetric tokens for the communication between community servers (federation), built on jose.
- `createTokens.jwt.ts` / `verifyTokens.jwt.ts`: HMAC signed tokens with node:crypto only, signed by a `JwtSigner` (HS256 or HS512).

One `AuthContext` per purpose a token is created for, built once at startup:

```ts
const authContext = authContextSchema.parse({
  issuer: CONFIG.COMMUNITY_URL,
  audience: ensureUrlEndsWithSlash(CONFIG.COMMUNITY_URL),
  duration: Duration.fromString(CONFIG.JWT_EXPIRES_IN), // "10m", "2h", "1d"
  signer: new JwtSigner(CONFIG.JWT_SECRET, AuthSigningType.HMAC),
})

const token = createUserToken(gradidoID, authContext)
const gradidoIdOrNull = verifyUserToken(token, authContext)
```

In use: the session token of a logged-in user (`backend/src/auth/JWT.ts`) and the handshake token for the GMS (`backend/src/apis/gms/GmsClient.ts`). Both are signed with the same secret for the same user; their audience (and signing type) keeps them apart, so a new purpose needs an audience of its own.

The payload follows `jwtPayloadSchema`: `iss`, `sub` (uuid v4, or `dlt-connector` for the dlt-connector), `aud` and `exp` are mandatory, `iat` is written into every created token. A token is accepted up to `JWT_LEEWAY_SECONDS` (3 minutes) after its `exp`. Verification returns `null` for every invalid token and logs the reason as warning; it does not throw.
