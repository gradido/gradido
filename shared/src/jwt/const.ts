export const JWT_HEADER_HMAC = { alg: 'HS256', typ: 'JWT' }
export const JWT_HEADER_HMAC_BASE64 = Buffer.from(JSON.stringify(JWT_HEADER_HMAC)).toString(
  'base64url',
)
