import { registerEnumType } from 'type-graphql'

export enum TransactionErrorType {
  NOT_IMPLEMENTED_YET = 'Not Implemented yet',
  MISSING_PARAMETER = 'Missing parameter',
  ALREADY_EXIST = 'Already exist',
  DB_ERROR = 'DB Error',
  PROTO_DECODE_ERROR = 'Proto Decode Error',
  PROTO_ENCODE_ERROR = 'Proto Encode Error',
  INVALID_SIGNATURE = 'Invalid Signature',
  LOGIC_ERROR = 'Logic Error',
  NOT_FOUND = 'Not found',
}

registerEnumType(TransactionErrorType, {
  name: 'TransactionErrorType',
  description: 'Transaction Error Type',
})
