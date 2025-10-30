// import { Semaphore } from 'await-semaphore'
import { Semaphore } from './Semaphore'

const CONCURRENT_TRANSACTIONS = 1
// export const TRANSACTIONS_LOCK = new Semaphore(CONCURRENT_TRANSACTIONS)
export const TRANSACTIONS_LOCK = Semaphore.create('TRANSACTIONS_LOCK', 1, 'backend')
