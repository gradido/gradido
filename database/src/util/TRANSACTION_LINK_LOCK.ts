import { Semaphore } from 'await-semaphore'

const CONCURRENT_TRANSACTIONS = 1
export const TRANSACTION_LINK_LOCK = new Semaphore(CONCURRENT_TRANSACTIONS)
