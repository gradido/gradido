# shared
Gradido Shared Code, Low-Level Shared Code, without dependencies on other modules

## Bun-Compatibility
Full bun compatible

## Enums
All enums used across more than one module
Additional with zod Schema but working only with zod v4 and this needs typescript 5

## Schemas
All schemas for data validation used across more than one module
Tests written for bun

## JWT
`src/jwt` holds two independent implementations:

- `JWT.ts`: asymmetric tokens for the communication between community servers (federation), built on jose.
- `createTokens.jwt.ts` / `verifyTokens.jwt.ts`: HS256 signed tokens with node:crypto only, one exported function per token type. So far: the session token of a logged-in user.

```ts
const authContext = authContextSchema.parse({
  issuer: CONFIG.COMMUNITY_URL,
  signingKey: createSecretKey(Buffer.from(CONFIG.JWT_SECRET, 'utf8')),
  duration: Duration.fromString(CONFIG.JWT_EXPIRES_IN), // "10m", "2h", "1d"
})

const token = createFrontendLoginToken(gradidoID, authContext)
const gradidoIdOrNull = verifyFrontendLoginToken(token, authContext)
```

The payload follows `jwtPayloadSchema`: `iss`, `sub` (uuid v4, or `dlt-connector` for the dlt-connector), `aud` and `exp` are mandatory, `iat` is written into every created token. A token is accepted up to `JWT_LEEWAY_SECONDS` (3 minutes) after its `exp`. Verification returns `null` for every invalid token and logs the reason as warning; it does not throw.
