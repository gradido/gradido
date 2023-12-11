import 'reflect-metadata'
import { registerEnumType } from 'type-graphql'

export enum TransactionType {
  GRADIDO_TRANSFER = 1,
  GRADIDO_CREATION = 2,
  GROUP_FRIENDS_UPDATE = 3,
  REGISTER_ADDRESS = 4,
  GRADIDO_DEFERRED_TRANSFER = 5,
  COMMUNITY_ROOT = 6,
}

registerEnumType(TransactionType, {
  name: 'TransactionType', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})

export function getTransactionTypeEnumValue(
  typeValue: number | string,
): TransactionType | undefined {
  if (typeof typeValue === 'number') {
    return TransactionType[typeValue] as unknown as TransactionType
  } else if (typeof typeValue === 'string') {
    for (const key in TransactionType) {
      if (TransactionType[key] === typeValue) {
        return TransactionType[key] as unknown as TransactionType
      }
    }
    return undefined // If the string is not found
  }
}
