/**
 * How a JWT is signed. HMAC stands for HS256, HMAC512 for HS512.
 */
export enum AuthSigningType {
  HMAC,
  HMAC512,
}
