/**
 * # TypeGuards  
 * Expand TypeScript Default Types with custom type which a based on a default type (or class)
 * Use valibot, so we can describe the type and validate it easy at runtime
 * After transpiling TypeScript unique symbol are gone
 * Infos at opaque type in typescript: https://evertpot.com/opaque-ts-types/
 * 
 * declare const validAmount: unique symbol
 * export type Amount = number & { [validAmount]: true };
 * Can be compared with using `typedef int Amount;` in C/C++
 * Example: 
 * To create a instance of Amount:
 * `const amount: Amount = v.parse(amountSchema, 1.21)` 
 * must be called and ensure the value is valid
 * If it isn't valid, v.parse will throw an error
 */

import { validate, version } from 'uuid'
import * as v from 'valibot'
import { MemoryBlock, DurationSeconds, GradidoUnit } from 'gradido-blockchain-js'

/**
 * type guard for uuid v4
 * create with `v.parse(uuidv4Schema, 'uuid')`
 * uuidv4 is used for communityUuid and userUuid
 */
declare const validUuidv4: unique symbol
export type Uuidv4 = string & { [validUuidv4]: true };

export const uuidv4Schema = v.custom<Uuidv4>((value) => 
  (typeof value === 'string' && validate(value) && version(value) === 4),
  'uuid v4 expected'
)

/**
 * type guard for uuid v4 hash
 * const uuidv4Value: Uuidv4 = v.parse(uuidv4Schema, 'uuid')
 * create with `v.parse(uuidv4HashSchema, uuidv4Value)`
 * uuidv4Hash is uuidv4 value hashed with BLAKE2b as Binary Type MemoryBlock from gradido-blockchain similar to Node.js Buffer Type,
 * used for iota topic
 */
declare const validUuidv4Hash: unique symbol
export type Uuidv4Hash = MemoryBlock & { [validUuidv4Hash]: true };

export const uuid4HashSchema = v.pipe(
  uuidv4Schema,
  v.transform<Uuidv4, Uuidv4Hash>(
    (input: Uuidv4) => MemoryBlock.fromHex(input.replace(/-/g, '')).calculateHash() as Uuidv4Hash,
  )
)

/**
 * type guard for topic index
 * const uuidv4Value: Uuidv4 = v.parse(uuidv4Schema, 'uuid')
 * const uuidv4Hash: Uuidv4Hash = v.parse(uuid4HashSchema, uuidv4Value)
 * create with `v.parse(topicIndexSchema, uuidv4Hash)`
 * topicIndex is uuidv4Hash value converted to hex string used for iota topic
 * The beauty of valibot allow also parse a uuidv4 string directly to topicIndex
 * const topic: TopicIndex = v.parse(topicIndexSchema, 'uuid')
 */
declare const validTopicIndex: unique symbol
export type TopicIndex = string & { [validTopicIndex]: true };

export const topicIndexSchema = v.pipe(
  v.union([uuidv4Schema, v.custom((val): val is Uuidv4Hash => val instanceof MemoryBlock)]),
  v.transform<any, TopicIndex>((input) => {
    const hash = typeof input === 'string'
      ? MemoryBlock.fromHex(input.replace(/-/g, '')).calculateHash()
      : input;
    return hash.convertToHex() as TopicIndex;
  })
)

/**
 * type guard for memo
 * create with `v.parse(memoSchema, 'memo')`
 * memo string inside bounds [5, 255]
 */
export const MEMO_MIN_CHARS = 5
export const MEMO_MAX_CHARS = 255

declare const validMemo: unique symbol
export type Memo = string & { [validMemo]: true };

export const memoSchema = v.pipe(
  v.string('expect string type'), 
  v.maxLength(MEMO_MAX_CHARS, `expect string length <= ${MEMO_MAX_CHARS}`),
  v.minLength(MEMO_MIN_CHARS, `expect string length >= ${MEMO_MIN_CHARS}`),
  v.transform<string, Memo>(
    (input: string) => input as Memo,
  ),
)

/**
 * type guard for timeout duration
 * create with `v.parse(timeoutDurationSchema, 123)`
 * timeout duration is a number in seconds inside bounds 
 * [1 hour, 3 months]
 * for Transaction Links / Deferred Transactions
 * seconds starting from createdAt Date in which the transaction link can be redeemed
 */
const LINKED_TRANSACTION_TIMEOUT_DURATION_MIN = 60*60
const LINKED_TRANSACTION_TIMEOUT_DURATION_MAX = 60*60*24*31*3

declare const validTimeoutDuration: unique symbol
export type TimeoutDuration = DurationSeconds & { [validTimeoutDuration]: true };

export const timeoutDurationSchema = v.pipe(
    v.number('expect number type'), 
    v.minValue(LINKED_TRANSACTION_TIMEOUT_DURATION_MIN, 'expect number >= 1 hour'),
    v.maxValue(LINKED_TRANSACTION_TIMEOUT_DURATION_MAX, 'expect number <= 3 months'),
    v.transform<number, TimeoutDuration>(
      (input: number) => new DurationSeconds(input) as TimeoutDuration,
    ),
)

/**
 * type guard for amount
 * create with `v.parse(amountSchema, '123')`
 * amount is a string representing a positive decimal number, compatible with decimal.js
 */
declare const validAmount: unique symbol
export type Amount = string & { [validAmount]: true };

export const amountSchema = v.pipe(
  v.string('expect string type'), 
  v.regex(/^[0-9]+(\.[0-9]+)?$/, 'expect positive number'),
  v.transform<string, Amount>(
    (input: string) => input as Amount,
  ),
)

/**
 * type guard for gradido amount
 * create with `v.parse(gradidoAmountSchema, '123')`
 * gradido amount is a string representing a positive decimal number, compatible with decimal.js
 */
declare const validGradidoAmount: unique symbol
export type GradidoAmount = GradidoUnit & { [validGradidoAmount]: true };

export const gradidoAmountSchema = v.pipe(
  amountSchema,
  v.transform<Amount, GradidoAmount>(
    (input: Amount) => GradidoUnit.fromString(input) as GradidoAmount,
  ),
)