import { nMonthsBefore } from '../factory/creation'

import { CreationInterface } from './CreationInterface'

export type { CreationInterface }

const bobsSendings = [
  {
    amount: 10,
    memo: 'Herzlich Willkommen bei Gradido!',
  },
  {
    amount: 10,
    memo: 'für deine Hilfe, Betty',
  },
  {
    amount: 23.37,
    memo: 'für deine Hilfe, David',
  },
  {
    amount: 47,
    memo: 'für deine Hilfe, Frau Holle',
  },
  {
    amount: 1.02,
    memo: 'für deine Hilfe, Herr Müller',
  },
  {
    amount: 5.67,
    memo: 'für deine Hilfe, Maier',
  },
  {
    amount: 72.93,
    memo: 'für deine Hilfe, Elsbeth',
  },
  {
    amount: 5.6,
    memo: 'für deine Hilfe, Daniel',
  },
  {
    amount: 8.87,
    memo: 'für deine Hilfe, Yoda',
  },
  {
    amount: 7.56,
    memo: 'für deine Hilfe, Sabine',
  },
  {
    amount: 7.89,
    memo: 'für deine Hilfe, Karl',
  },
  {
    amount: 8.9,
    memo: 'für deine Hilfe, Darth Vader',
  },
  {
    amount: 56.79,
    memo: 'für deine Hilfe, Luci',
  },
  {
    amount: 3.45,
    memo: 'für deine Hilfe, Hanne',
  },
  {
    amount: 8.74,
    memo: 'für deine Hilfe, Luise',
  },
  {
    amount: 7.85,
    memo: 'für deine Hilfe, Annegred',
  },
  {
    amount: 32.7,
    memo: 'für deine Hilfe, Prinz von Zamunda',
  },
  {
    amount: 44.2,
    memo: 'für deine Hilfe, Charly Brown',
  },
  {
    amount: 38.17,
    memo: 'für deine Hilfe, Michael',
  },
  {
    amount: 5.72,
    memo: 'für deine Hilfe, Kaja',
  },
  {
    amount: 3.99,
    memo: 'für deine Hilfe, Maja',
  },
  {
    amount: 4.5,
    memo: 'für deine Hilfe, Martha',
  },
  {
    amount: 8.3,
    memo: 'für deine Hilfe, Ursula',
  },
  {
    amount: 2.9,
    memo: 'für deine Hilfe, Urs',
  },
  {
    amount: 4.6,
    memo: 'für deine Hilfe, Mecedes',
  },
  {
    amount: 74.1,
    memo: 'für deine Hilfe, Heidi',
  },
  {
    amount: 4.5,
    memo: 'für deine Hilfe, Peter',
  },
  {
    amount: 5.8,
    memo: 'für deine Hilfe, Fräulein Rottenmeier',
  },
]
const bobsTransactions: CreationInterface[] = []
bobsSendings.forEach((sending) => {
  bobsTransactions.push({
    email: 'bob@baumeister.de',
    amount: sending.amount,
    memo: sending.memo,
    contributionDate: nMonthsBefore(new Date()),
    confirmed: true,
  })
})

export const creations: CreationInterface[] = [
  {
    email: 'bibi@bloxberg.de',
    amount: 1000,
    memo: 'Herzlich Willkommen bei Gradido!',
    contributionDate: nMonthsBefore(new Date()),
    confirmed: true,
    moveCreationDate: 12,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 1000,
    memo: '#Hexen',
    contributionDate: nMonthsBefore(new Date()),
    confirmed: true,
  },
  ...bobsTransactions,
  {
    email: 'raeuber@hotzenplotz.de',
    amount: 1000,
    memo: 'Herzlich Willkommen bei Gradido!',
    contributionDate: nMonthsBefore(new Date()),
    confirmed: true,
  },
]
