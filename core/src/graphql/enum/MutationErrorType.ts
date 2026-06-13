import { registerEnumType } from 'type-graphql'

export enum MutationErrorType {
  UNKNOWN = 'UNKNOWN',
  HTTP_ERROR = 'HTTP_ERROR',
  DLT_CONNECTOR_ERROR = 'DLT_CONNECTOR_ERROR',
  DB_ENTRY_NOT_FOUND = 'DB_ENTRY_NOT_FOUND',
  PROTOBUF_DECODE_ERROR = 'PROTOBUF_DECODE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_COMMUNITY = 'UNKNOWN_COMMUNITY',
}

registerEnumType(MutationErrorType, {
  name: 'MutationErrorType', // this one is mandatory
  description: 'Type of the mutation error', // this one is optional
})
