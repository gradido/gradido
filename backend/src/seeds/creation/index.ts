import { CreationInterface } from './CreationInterface'
import { nMonthsBefore } from '../factory/creation'

const bobsSendings = [
  {
    amount: 10,
    memo: 'Herzlich Willkommen bei Gradido!',
  },
  {
    amount: 10,
    memo: 'von Betty',
  },
  {
    amount: 23.37,
    memo: 'von David',
  },
  {
    amount: 47,
    memo: 'von Frau Holle',
  },
  {
    amount: 1.02,
    memo: 'von Herr Müller',
  },
  {
    amount: 5.67,
    memo: 'von Maier',
  },
  {
    amount: 72.93,
    memo: 'von Elsbeth',
  },
  {
    amount: 5.6,
    memo: 'von Daniel',
  },
  {
    amount: 8.87,
    memo: 'von Yoda',
  },
  {
    amount: 7.56,
    memo: 'von Sabine',
  },
  {
    amount: 7.89,
    memo: 'von Karl',
  },
  {
    amount: 8.9,
    memo: 'von Darth Vader',
  },
  {
    amount: 56.79,
    memo: 'von Luci',
  },
  {
    amount: 3.45,
    memo: 'von Hanne',
  },
  {
    amount: 8.74,
    memo: 'von Luise',
  },
  {
    amount: 7.85,
    memo: 'von Annegred',
  },
  {
    amount: 32.7,
    memo: 'von Prinz von Zamunda',
  },
  {
    amount: 44.2,
    memo: 'von Charly Brown',
  },
  {
    amount: 38.17,
    memo: 'von Michael',
  },
  {
    amount: 5.72,
    memo: 'von Kaja',
  },
  {
    amount: 3.99,
    memo: 'von Maja',
  },
  {
    amount: 4.5,
    memo: 'von Martha',
  },
  {
    amount: 8.3,
    memo: 'von Ursula',
  },
  {
    amount: 2.9,
    memo: 'von Urs',
  },
  {
    amount: 4.6,
    memo: 'von Mecedes',
  },
  {
    amount: 74.1,
    memo: 'von Heidi',
  },
  {
    amount: 4.5,
    memo: 'von Peter',
  },
  {
    amount: 5.8,
    memo: 'von Frau Rottenmeier',
  },
]
let bobsSum = 0
const bobsTransactions: CreationInterface[] = []
bobsSendings.forEach((sending) => {
  bobsSum = bobsSum + sending.amount
  bobsTransactions.push({
    email: 'bob@baumeister.de',
    amount: sending.amount,
    memo: sending.memo,
    creationDate: nMonthsBefore(new Date()),
    confirmed: true,
  })
})
// Wolle: console.log('bobsSum: ', bobsSum)

export const creations: CreationInterface[] = [
  {
    email: 'bibi@bloxberg.de',
    amount: 1000,
    memo: 'Herzlich Willkommen bei Gradido!',
    creationDate: nMonthsBefore(new Date()),
    confirmed: true,
    moveCreationDate: 12,
  },
  ...bobsTransactions,
  {
    email: 'raeuber@hotzenplotz.de',
    amount: 1000,
    memo: 'Herzlich Willkommen bei Gradido!',
    creationDate: nMonthsBefore(new Date()),
    confirmed: true,
  },
]
