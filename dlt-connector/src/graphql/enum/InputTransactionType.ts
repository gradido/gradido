import { LogError } from '@/server/LogError'
import { registerEnumType } from 'type-graphql'

export enum InputTransactionType {
  CREATION = 1,
  SEND = 2,
  RECEIVE = 3,
}

registerEnumType(InputTransactionType, {
  name: 'InputTransactionType', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})

// from ChatGPT
export function getTransactionTypeString(id: InputTransactionType): string {
  const key = Object.keys(InputTransactionType).find(
    (key) => InputTransactionType[key as keyof typeof InputTransactionType] === id,
  )
  if (key === undefined) {
    throw new LogError('invalid transaction type id: ' + id.toString())
  }
  return key
}
