import * as v from 'valibot'

export enum UserContactType {
  USER_CONTACT_EMAIL = 'EMAIL',
  USER_CONTACT_PHONE = 'PHONE',
}

export const UserContactTypeSchema = v.enum(UserContactType)
