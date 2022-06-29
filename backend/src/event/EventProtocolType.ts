import { registerEnumType } from 'type-graphql'

export enum EventProtocolType {
  BASIC = '0',
  VISIT_GRADIDO = '10',
  REGISTER = '20',
  REDEEM_REGISTER = '21',
  INACTIVE_ACCOUNT = '22',
  SEND_CONFIRMATION_EMAIL = '23',
  CONFIRM_EMAIL = '24',
  REGISTER_EMAIL_KLICKTIPP = '25',
  LOGIN = '30',
  REDEEM_LOGIN = '31',
  ACTIVATE_ACCOUNT = '32',
  PASSWORD_CHANGE = '33',
  TRANSACTION_SEND = '40',
  TRANSACTION_SEND_REDEEM = '41',
  TRANSACTION_REPEATE_REDEEM = '42',
  TRANSACTION_CREATION = '50',
  TRANSACTION_RECEIVE = '51',
  TRANSACTION_RECEIVE_REDEEM = '52',
  CONTRIBUTION_CREATE = '60',
  CONTRIBUTION_CONFIRM = '61',
  CONTRIBUTION_LINK_DEFINE = '70',
  CONTRIBUTION_LINK_ACTIVATE_REDEEM = '71',
}

registerEnumType(EventProtocolType, {
  name: 'EventProtocolType', // this one is mandatory
  description: 'Name of the Type of the EventProtocol', // this one is optional
})
