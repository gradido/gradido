import { Semaphore } from 'await-semaphore'

const CONCURRENT_TRANSACTIONS = 1
export const TRANSACTIONS_LOCK = new Semaphore(CONCURRENT_TRANSACTIONS)
