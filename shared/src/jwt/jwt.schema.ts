import { createPrivateKey, createPublicKey } from 'node:crypto'
import { z } from 'zod'

export const privateJwtKeySchema = z.string().superRefine((value, ctx) => {
  try {
    const key = createPrivateKey(value)

    if (key.asymmetricKeyType !== 'rsa') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Not an RSA private key',
      })
    }
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid private key',
    })
  }
})

export const publicJwtKeySchema = z.string().superRefine((value, ctx) => {
  try {
    const key = createPublicKey(value)

    if (key.asymmetricKeyType !== 'rsa') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Not an RSA public key',
      })
    }
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid public key',
    })
  }
})
