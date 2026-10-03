/**
 * The one JOSE header the native HMAC implementation writes and accepts.
 */
export const JWT_HEADER_HMAC = { alg: 'HS256', typ: 'JWT' }
/**
 * `JWT_HEADER_HMAC` as first segment of a token. Verification compares a token's header against
 * this string instead of parsing it, so a header with the same meaning but other bytes
 * (other key order, no `typ`) does not pass.
 */
export const JWT_HEADER_HMAC_BASE64 = Buffer.from(JSON.stringify(JWT_HEADER_HMAC)).toString(
  'base64url',
)
