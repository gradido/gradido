import { CreationInterface } from './CreationInterface'

const lastMonth = (date: Date): string => {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1).toISOString()
}

export const creations: CreationInterface[] = [
  {
    email: 'bibi@bloxberg.de',
    amount: 1000,
    memo: 'Herzlich Willkommen bei Gradido!',
    creationDate: lastMonth(new Date()),
    confirmed: true,
  },
  {
    email: 'bob@baumeister.de',
    amount: 1000,
    memo: 'Herzlich Willkommen bei Gradido!',
    creationDate: lastMonth(new Date()),
    confirmed: true,
  },
  {
    email: 'raeuber@hotzenplotz.de',
    amount: 1000,
    memo: 'Herzlich Willkommen bei Gradido!',
    creationDate: lastMonth(new Date()),
    confirmed: true,
  },
]
