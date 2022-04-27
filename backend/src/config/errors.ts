// !!! sync with 'frontend/src/config/errors.js'

export enum ERRORS {
  ERR_EMAIL_NOT_VALIDATED = 1,
  ERR_USER_HAS_NO_PASSWORD = 2,
  ERR_USER_ALREADY_EXISTS = 3,
}

export const ERRORS_DESCRIPTION = {
  ERR_EMAIL_NOT_VALIDATED: 'User email not validated',
  ERR_USER_HAS_NO_PASSWORD: 'User has no password set yet',
  ERR_USER_ALREADY_EXISTS: 'User already exists.',
}
