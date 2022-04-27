// !!! sync with backend/src/config/errors.ts

// handle enums in JS: https://masteringjs.io/tutorials/fundamentals/enum

export const ERRORS = {
  ERR_EMAIL_NOT_VALIDATED: 'ERR_EMAIL_NOT_VALIDATED',
  ERR_USER_HAS_NO_PASSWORD: 'ERR_USER_HAS_NO_PASSWORD',
  ERR_USER_ALREADY_EXISTS: 'ERR_USER_ALREADY_EXISTS',
}

export const ERRORS_DESCRIPTION = {
  ERR_EMAIL_NOT_VALIDATED: 'User email not validated',
  ERR_USER_HAS_NO_PASSWORD: 'User has no password set yet',
  ERR_USER_ALREADY_EXISTS: 'User already exists.',
}
