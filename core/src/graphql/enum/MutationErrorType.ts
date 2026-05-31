import { registerEnumType } from "type-graphql";

export enum MutationErrorType {
  UNKNOWN = 'UNKNOWN',
}

registerEnumType(MutationErrorType, {
  name: 'MutationErrorType', // this one is mandatory
  description: 'Type of the mutation error', // this one is optional
})