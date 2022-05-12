import { TransactionInterface } from "./transactionInterface"

export const transactions: TransactionInterface[] = [
  {
    email: 'bibi@bloxberg.de',
    amount: 9.99,
    memo: 'Die erste kleine test Transaction zum Neujahr',
    createdAt: new Date(2022, 0, 1),
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 9.99,
    memo: `Sei bei der neuen schenck
Kampagne dabei!`,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: `Sei bei der neuen schenck
Kampagne dabei!`,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 9.99,
    memo: `Sei bei der neuen schenck
Kampagne dabei!`,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: `Sei bei der neuen schenck
Kampagne dabei!`,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 9.99,
    memo: `Sei bei der neuen schenck
Kampagne dabei!`,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: `Sei bei der neuen schenck
Kampagne dabei!`,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: `Sei bei der neuen schenck
Kampagne dabei!`,
    deletedAt: true,
  },
]
