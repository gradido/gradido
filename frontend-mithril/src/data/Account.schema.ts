// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

// The answers of the account's mutations: each names its field, so that an answer without it
// (`{}`) is a failure and not a success. What they say beyond being there is not read.
export const createUserSchema = v.object({ createUser: v.boolean() })
export const forgotPasswordSchema = v.object({ forgotPassword: v.boolean() })
export const queryOptInSchema = v.object({ queryOptIn: v.boolean() })
export const setPasswordSchema = v.object({ setPassword: v.boolean() })
export const confirmEmailSchema = v.object({ confirmEmail: v.boolean() })
export const confirmEmailChangeSchema = v.object({ confirmEmailChange: v.string() })
export const revokeEmailChangeSchema = v.object({ revokeEmailChange: v.boolean() })
export const updateLanguageSchema = v.object({ updateUserInfos: v.boolean() })
