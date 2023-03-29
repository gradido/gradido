/* MIGRATION TO CHANGE EVENT NAMES
 *
 * This migration renames several events to ensure consistent
 * naming conventions.
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'UPDATE `events` SET `type` = "USER_ACTIVATE_ACCOUNT" WHERE `type` = "ACTIVATE_ACCOUNT";',
  )
  await queryFn('UPDATE `events` SET `type` = "USER_LOGIN" WHERE `type` = "LOGIN";')
  await queryFn('UPDATE `events` SET `type` = "USER_LOGOUT" WHERE `type` = "LOGOUT";')
  await queryFn('UPDATE `events` SET `type` = "USER_REGISTER" WHERE `type` = "REGISTER";')
  await queryFn(
    'UPDATE `events` SET `type` = "EMAIL_ACCOUNT_MULTIREGISTRATION" WHERE `type` = "SEND_ACCOUNT_MULTIREGISTRATION_EMAIL";',
  )
  await queryFn(
    'UPDATE `events` SET `type` = "EMAIL_CONFIRMATION" WHERE `type` = "SEND_CONFIRMATION_EMAIL";',
  )
  await queryFn(
    'UPDATE `events` SET `type` = "EMAIL_ADMIN_CONFIRMATION" WHERE `type` = "ADMIN_SEND_CONFIRMATION_EMAIL";',
  )
  await queryFn(
    'UPDATE `events` SET `type` = "USER_REGISTER_REDEEM" WHERE `type` = "REDEEM_REGISTER";',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'UPDATE `events` SET `type` = "REDEEM_REGISTER" WHERE `type` = "USER_REGISTER_REDEEM";',
  )
  await queryFn(
    'UPDATE `events` SET `type` = "ADMIN_SEND_CONFIRMATION_EMAIL" WHERE `type` = "EMAIL_ADMIN_CONFIRMATION";',
  )
  await queryFn(
    'UPDATE `events` SET `type` = "SEND_CONFIRMATION_EMAIL" WHERE `type` = "EMAIL_CONFIRMATION";',
  )
  await queryFn(
    'UPDATE `events` SET `type` = "SEND_ACCOUNT_MULTIREGISTRATION_EMAIL" WHERE `type` = "EMAIL_ACCOUNT_MULTIREGISTRATION";',
  )
  await queryFn('UPDATE `events` SET `type` = "REGISTER" WHERE `type` = "USER_REGISTER";')
  await queryFn('UPDATE `events` SET `type` = "LOGOUT" WHERE `type` = "USER_LOGOUT";')
  await queryFn('UPDATE `events` SET `type` = "LOGIN" WHERE `type` = "USER_LOGIN";')
  await queryFn(
    'UPDATE `events` SET `type` = "ACTIVATE_ACCOUNT" WHERE `type` = "USER_ACTIVATE_ACCOUNT";',
  )
}
