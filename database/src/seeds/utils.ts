import { randomBytes } from 'node:crypto'

export function generateRandomNumber(): BigInt {
  return BigInt(randomBytes(8).readBigUInt64LE())
}
export function generateRandomNumericString(length: number = 64): string {
  const digits = '0123456789'
  const bytes = randomBytes(length / 8)
  return Array.from(bytes, (b) => digits[b % 10]).join('').slice(0, length)
}