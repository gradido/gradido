import { CreationInterface } from './CreationInterface'
import { nMonthsBefore } from '../factory/creation'

export const creations: CreationInterface[] = [
  {
    email: 'bibi@bloxberg.de',
    amount: 1000,
    memo: 'Herzlich Willkommen bei Gradido!',
    creationDate: nMonthsBefore(new Date()),
    confirmed: true,
    moveCreationDate: 12,
  },
  {
    email: 'bob@baumeister.de',
    amount: 1000,
    memo: 'Herzlich Willkommen bei Gradido!',
    creationDate: nMonthsBefore(new Date()),
    confirmed: true,
    moveCreationDate: 8,
  },
  {
    email: 'raeuber@hotzenplotz.de',
    amount: 1000,
    memo: 'Herzlich Willkommen bei Gradido!',
    creationDate: nMonthsBefore(new Date()),
    confirmed: true,
  },
]
