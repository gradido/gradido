// import { Semaphore } from 'await-semaphore'
import { Semaphore } from "./Semaphore"

const CONCURRENT_TRANSACTIONS = 1
// export const TRANSACTION_LINK_LOCK = new Semaphore(CONCURRENT_TRANSACTIONS)
export const TRANSACTION_LINK_LOCK = Semaphore.create('TRANSACTION_LINK_LOCK', 1, 'backend')
