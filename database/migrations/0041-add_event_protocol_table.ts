/* MIGRATION TO ADD EVENT_PROTOCOL
 *
 * This migration adds the table `event_protocol` in order to store all sorts of business event data
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
      CREATE TABLE IF NOT EXISTS \`event_protocol\` (
        \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
        \`type\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`user_id\` int(10) unsigned NOT NULL,
        \`x_user_id\` int(10) unsigned NULL DEFAULT NULL,
        \`x_community_id\` int(10) unsigned NULL DEFAULT NULL,
        \`transaction_id\` int(10) unsigned NULL DEFAULT NULL,
        \`contribution_id\` int(10) unsigned NULL DEFAULT NULL,
        \`amount\` bigint(20) NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
/*
  await queryFn(`
      CREATE TABLE IF NOT EXISTS \`enum_event_type\` (
        \`key\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`value\` int(10) unsigned NOT NULL,
        \`description\` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
        PRIMARY KEY (\`key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('BASIC', 0, 'BasicEvent: the basic event is the root of all further extending event types');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('VISIT_GRADIDO', 10, 'VisitGradidoEvent: if a user visits a gradido page without login or register');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('REGISTER', 20, 'RegisterEvent: the user presses the register button');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('REDEEM_REGISTER', 21, 'RedeemRegisterEvent: the user presses the register button initiated by the redeem link');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('INACTIVE_ACCOUNT', 22, 'InActiveAccountEvent: the systems create an inactive account during the register process');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('SEND_CONFIRMATION_EMAIL', 23, 'SendConfirmEmailEvent: the system send a confirmation email to the user during the register process');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('CONFIRM_EMAIL', 24, 'ConfirmEmailEvent: the user confirms his email during the register process');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('REGISTER_EMAIL_KLICKTIPP', 25, 'RegisterEmailKlickTippEvent: the system registers the confirmed email at klicktipp');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('LOGIN', 30, 'LoginEvent: the user presses the login button');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('REDEEM_LOGIN', 31, 'RedeemLoginEvent: the user presses the login button initiated by the redeem link');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('ACTIVATE_ACCOUNT', 32, 'ActivateAccountEvent: the system activates the users account during the first login process');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('PASSWORD_CHANGE', 33, 'PasswordChangeEvent: the user changes his password');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('TRANSACTION_SEND', 40, 'TransactionSendEvent: the user creates a transaction and sends it online');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('TRANSACTION_SEND_REDEEM', 41, 'TransactionSendRedeemEvent: the user creates a transaction and sends it per redeem link');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('TRANSACTION_REPEATE_REDEEM', 42, 'TransactionRepeateRedeemEvent: the user recreates a redeem link of a still open transaction');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('TRANSACTION_CREATION', 50, 'TransactionCreationEvent: the user receives a creation transaction for his confirmed contribution');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('TRANSACTION_RECEIVE', 51, 'TransactionReceiveEvent: the user receives a transaction from an other user and posts the amount on his account');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('TRANSACTION_RECEIVE_REDEEM', 52, 'TransactionReceiveRedeemEvent: the user activates the redeem link and receives the transaction and posts the amount on his account');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('CONTRIBUTION_CREATE', 60, 'ContributionCreateEvent: the user enters his contribution and asks for confirmation');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('CONTRIBUTION_CONFIRM', 61, 'ContributionConfirmEvent: the user confirms a contribution of an other user (for future multi confirmation from several users)');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('CONTRIBUTION_LINK_DEFINE', 70, 'ContributionLinkDefineEvent: the admin user defines a contributionLink, which could be send per Link/QR-Code on an other medium');`,
  )
  await queryFn(
    `INSERT INTO \`enum_event_type\` (\`key\`, \`value\`, \`description\`) VALUES ('CONTRIBUTION_LINK_ACTIVATE_REDEEM', 71, 'ContributionLinkActivateRedeemEvent: the user activates a received contributionLink to create a contribution entry for the contributionLink');`,
  )
  */
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS \`event_protocol\`;`)
  // await queryFn(`DROP TABLE IF EXISTS \`enum_event_type\`;`)
}
