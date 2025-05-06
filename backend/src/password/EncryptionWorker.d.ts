
export function SecretKeyCryptographyCreateKeyFunc(
  salt: string,
  password: string,
  configLoginAppSecret: Buffer,
  configLoginServerKey: Buffer
): bigint;