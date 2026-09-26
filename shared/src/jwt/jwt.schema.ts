import { z } from 'zod'
import { getPrivateKeyObjekt, getPublicKeyObject } from '.'

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
