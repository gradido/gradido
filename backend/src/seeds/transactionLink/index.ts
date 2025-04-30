import { TransactionLinkInterface } from './TransactionLinkInterface'

export const transactionLinks: TransactionLinkInterface[] = [
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: 'Leider wollte niemand meine Gradidos zum Neujahr haben :(',
    createdAt: new Date(2022, 0, 1),
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: `Kein Trick, keine Zauberrei,
bei Gradidio sei dabei!`,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: `Kein Trick, keine Zauberrei,
bei Gradidio sei dabei!`,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: `Kein Trick, keine Zauberrei,
bei Gradidio sei dabei!`,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: `Kein Trick, keine Zauberrei,
bei Gradidio sei dabei!`,
    // TODO: for testing
    // memo: `Yeah, eingelöst!`,
    // redeemedAt: new Date(2022, 2, 2),
    // redeemedBy: not null,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: `Kein Trick, keine Zauberrei,
bei Gradidio sei dabei!`,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: `Kein Trick, keine Zauberrei,
bei Gradidio sei dabei!`,
  },
  {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: 'Da habe ich mich wohl etwas übernommen.',
    deletedAt: true,
  },
]
