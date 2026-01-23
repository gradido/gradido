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
 * Alternatively v.safeParse can be used, this don't throw but it return null on error
 */

import { DurationSeconds, GradidoUnit, MemoryBlock, MemoryBlockPtr } from 'gradido-blockchain-js'
import { validate, version } from 'uuid'
import * as v from 'valibot'

/**
 * type guard for uuid v4
 * create with `v.parse(uuidv4Schema, 'uuid')`
 * uuidv4 is used for communityUuid and userUuid
 */
declare const validUuidv4: unique symbol
export type Uuidv4 = string & { [validUuidv4]: true }

export const uuidv4Schema = v.pipe(
  v.string('expect string type'),
  v.custom<string>(
    (value) => typeof value === 'string' && validate(value) && version(value) === 4,
    'uuid v4 expected',
  ),
  v.transform<string, Uuidv4>((input: string) => input as Uuidv4),
)

export type Uuidv4Input = v.InferInput<typeof uuidv4Schema>

/**
 * type guard for seed string
 * create with `v.parse(seedSchema, '0c4676adfd96519a0551596c')`
 * seed is a string of length 24
 */
declare const validIdentifierSeed: unique symbol
export type IdentifierSeed = string & { [validIdentifierSeed]: true }

// use code from transaction links
export const identifierSeedSchema = v.pipe(
  v.string('expect string type'),
  v.hexadecimal('expect hexadecimal string'),
  v.length(24, 'expect seed length 24'),
  v.transform<string, IdentifierSeed>((input: string) => input as IdentifierSeed),
)

export type IdentifierSeedInput = v.InferInput<typeof identifierSeedSchema>

/**
 * type guard for memory block size 32
 * create with `v.parse(memoryBlock32Schema, MemoryBlock.fromHex('39568d7e148a0afee7f27a67dbf7d4e87d1fdec958e2680df98a469690ffc1a2'))`
 * memoryBlock32 is a non-empty MemoryBlock with size 32
 */

declare const validMemoryBlock32: unique symbol
export type MemoryBlock32 = MemoryBlockPtr & { [validMemoryBlock32]: true }

export const memoryBlock32Schema = v.pipe(
  v.union([
    v.instance(MemoryBlock, 'expect MemoryBlock type'),
    v.instance(MemoryBlockPtr, 'expect MemoryBlockPtr type'),
  ]),
  v.custom<MemoryBlock | MemoryBlockPtr>((val): boolean => {
    if (val instanceof MemoryBlockPtr) {
      return val.size() === 32 && !val.isEmpty()
    }
    if (val instanceof MemoryBlock) {
      return val.size() === 32 && !val.isEmpty()
    }
    return false
  }, 'expect MemoryBlock size = 32 and not empty'),
  v.transform<MemoryBlock | MemoryBlockPtr, MemoryBlock32>(
    (input: MemoryBlock | MemoryBlockPtr) => {
      let memoryBlock: MemoryBlockPtr = input as MemoryBlockPtr
      if (input instanceof MemoryBlock) {
        memoryBlock = MemoryBlock.createPtr(input)
      }
      return memoryBlock as MemoryBlock32
    },
  ),
)

/**
 * type guard for hex string of length 64 (binary size = 32)
 * create with `v.parse(hex32Schema, '39568d7e148a0afee7f27a67dbf7d4e87d1fdec958e2680df98a469690ffc1a2')`
 * or `v.parse(hex32Schema, MemoryBlock.fromHex('39568d7e148a0afee7f27a67dbf7d4e87d1fdec958e2680df98a469690ffc1a2'))`
 * hex32 is a hex string of length 64 (binary size = 32)
 */
declare const validHex32: unique symbol
export type Hex32 = string & { [validHex32]: true }

export const hex32Schema = v.pipe(
  v.union([
    v.pipe(
      v.string('expect string type'),
      v.hexadecimal('expect hexadecimal string'),
      v.length(64, 'expect string length = 64'),
    ),
    memoryBlock32Schema,
  ]),
  v.transform<string | MemoryBlock32 | Hex32, Hex32>((input: string | MemoryBlock32 | Hex32) => {
    if (typeof input === 'string') {
      return input as Hex32
    }
    return input.convertToHex() as Hex32
  }),
)

export type Hex32Input = v.InferInput<typeof hex32Schema>

/**
 * type guard for hiero id
 * create with `v.parse(hieroIdSchema, '0.0.2')`
 * hiero id is a hiero id of the form 0.0.2
 */
declare const validHieroId: unique symbol
export type HieroId = string & { [validHieroId]: true }

export const hieroIdSchema = v.pipe(
  v.string('expect hiero id type, three 64 Bit Numbers separated by . for example 0.0.2'),
  v.regex(/^[0-9]+\.[0-9]+\.[0-9]+$/),
  v.transform<string, HieroId>((input: string) => input as HieroId),
)

export type HieroIdInput = v.InferInput<typeof hieroIdSchema>

/**
 * type guard for hiero transaction id
 * create with `v.parse(hieroTransactionIdSchema, '0.0.141760-1755138896-607329203')`
 * hiero transaction id is a hiero transaction id of the form 0.0.141760-1755138896-607329203
 * basically it is a Hiero id with a timestamp seconds-nanoseconds since 1970-01-01T00:00:00Z
 * seconds is int64, nanoseconds int32
 */
declare const validHieroTransactionIdString: unique symbol
export type HieroTransactionIdString = string & { [validHieroTransactionIdString]: true }

export const hieroTransactionIdStringSchema = v.pipe(
  v.string(
    'expect hiero transaction id type, for example 0.0.141760-1755138896-607329203 or 0.0.141760@1755138896.607329203',
  ),
  v.regex(/^[0-9]+\.[0-9]+\.[0-9]+(-[0-9]+-[0-9]+|@[0-9]+\.[0-9]+)$/),
  v.transform<string, HieroTransactionIdString>(
    (input: string) => input as HieroTransactionIdString,
  ),
)

export type HieroTransactionIdInput = v.InferInput<typeof hieroTransactionIdStringSchema>

/**
 * type guard for memo
 * create with `v.parse(memoSchema, 'memo')`
 * memo string inside bounds [5, 255]
 */
export const MEMO_MIN_CHARS = 5
export const MEMO_MAX_CHARS = 512

declare const validMemo: unique symbol
export type Memo = string & { [validMemo]: true }

export const memoSchema = v.pipe(
  v.string('expect string type'),
  v.maxLength(MEMO_MAX_CHARS, `expect string length <= ${MEMO_MAX_CHARS}`),
  v.minLength(MEMO_MIN_CHARS, `expect string length >= ${MEMO_MIN_CHARS}`),
  v.transform<string, Memo>((input: string) => input as Memo),
)

/**
 * type guard for timeout duration
 * create with `v.parse(timeoutDurationSchema, 123)`
 * timeout duration is a number in seconds inside bounds
 * [1 hour, 3 months]
 * for Transaction Links / Deferred Transactions
 * seconds starting from createdAt Date in which the transaction link can be redeemed
 */
const LINKED_TRANSACTION_TIMEOUT_DURATION_MIN = 60 * 60
const LINKED_TRANSACTION_TIMEOUT_DURATION_MAX = 60 * 60 * 24 * 31 * 3

declare const validTimeoutDuration: unique symbol
export type TimeoutDuration = DurationSeconds & { [validTimeoutDuration]: true }

export const timeoutDurationSchema = v.pipe(
  v.union([
    v.pipe(
      v.number('expect number type'),
      v.minValue(LINKED_TRANSACTION_TIMEOUT_DURATION_MIN, 'expect number >= 1 hour'),
      v.maxValue(LINKED_TRANSACTION_TIMEOUT_DURATION_MAX, 'expect number <= 3 months'),
    ),
    v.instance(DurationSeconds, 'expect DurationSeconds type'),
  ]),
  v.transform<number | DurationSeconds, TimeoutDuration>((input: number | DurationSeconds) => {
    if (input instanceof DurationSeconds) {
      return input as TimeoutDuration
    }
    return new DurationSeconds(input) as TimeoutDuration
  }),
)

/**
 * type guard for amount
 * create with `v.parse(amountSchema, '123')`
 * amount is a string representing a positive decimal number, compatible with decimal.js
 */
declare const validAmount: unique symbol
export type Amount = string & { [validAmount]: true }

export const amountSchema = v.pipe(
  v.string('expect string type'),
  v.regex(/^[0-9]+(\.[0-9]+)?$/, 'expect positive number'),
  v.transform<string, Amount>((input: string) => input as Amount),
)

/**
 * type guard for gradido amount
 * create with `v.parse(gradidoAmountSchema, '123')`
 * gradido amount is a GradidoUnit representing a positive gradido amount stored intern as integer with 4 decimal places
 * GradidoUnit is native implemented in gradido-blockchain-js in c++ and has functions for decay calculation
 */
declare const validGradidoAmount: unique symbol
export type GradidoAmount = GradidoUnit & { [validGradidoAmount]: true }

export const gradidoAmountSchema = v.pipe(
  v.union([amountSchema, v.instance(GradidoUnit, 'expect GradidoUnit type')]),
  v.transform<Amount | GradidoUnit, GradidoAmount>((input: Amount | GradidoUnit) => {
    if (input instanceof GradidoUnit) {
      return input as GradidoAmount
    }
    return GradidoUnit.fromString(input) as GradidoAmount
  }),
)
