// AI-GENERATED — not an architecture reference
import { CONFIG } from '@/config'

/**
 * The two windows every e-mail code lives by, shared by registration, password reset and
 * the e-mail change. Moved here from `UserResolver` so the change can use them without a
 * second copy; behaviour is unchanged.
 *
 * Both take the moment the code was (re)issued - `updatedAt` of the contact row, falling
 * back to `createdAt` while it was never touched.
 */
const isWithinWindow = (issuedAt: Date, durationMinutes: number): boolean => {
  const elapsed = Date.now() - new Date(issuedAt).getTime()
  return elapsed <= durationMinutes * 60 * 1000
}

/** A code is usable for `EMAIL_CODE_VALID_TIME` minutes after it was issued. */
export const isEmailVerificationCodeValid = (issuedAt: Date): boolean => {
  return isWithinWindow(issuedAt, CONFIG.EMAIL_CODE_VALID_TIME)
}

/** A new mail may go out once `EMAIL_CODE_REQUEST_TIME` minutes have passed since the last. */
export const canEmailResend = (issuedAt: Date): boolean => {
  return !isWithinWindow(issuedAt, CONFIG.EMAIL_CODE_REQUEST_TIME)
}

/** The moment a code issued at `issuedAt` stops working. */
export const emailVerificationCodeValidUntil = (issuedAt: Date): Date => {
  return new Date(new Date(issuedAt).getTime() + CONFIG.EMAIL_CODE_VALID_TIME * 60 * 1000)
}

/** The moment a pending e-mail change issued before has run past its window. */
export const emailChangeExpiryCutoff = (): Date => {
  return new Date(Date.now() - CONFIG.EMAIL_CODE_VALID_TIME * 60 * 1000)
}

/** When the next mail for something issued at `issuedAt` may go out. */
export const resendAllowedAt = (issuedAt: Date): Date => {
  return new Date(new Date(issuedAt).getTime() + CONFIG.EMAIL_CODE_REQUEST_TIME * 60 * 1000)
}
