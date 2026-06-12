/// <reference types="node" />

/**
 * data/unit.h {@link include/gradido_blockchain_core/data/unit.h}
 */

/**
 * Returns the decay start time as a JavaScript Date object.
 */
export function getDecayStartTime(): Date

/**
 * Calculates decay for a given BigInt value over a duration in seconds.
 * @param value - The BigInt value to decay (in gdd units)
 * @param seconds - The duration in seconds
 * @returns The decayed BigInt value (in gdd units)
 */
export function calculateDecay(value: bigint, seconds: bigint): bigint

/**
 * Converts a string to a BigInt value.
 * @param str - The string to convert
 * @returns The BigInt value
 */
export function gradidoUnitFromString(str: string): bigint

/**
 * Converts a BigInt value to a string.
 * @param value - The BigInt value to convert
 * @param precision - The number of decimal places to include (max/default: 4)
 * @returns The string representation of the BigInt value
 */
export function gradidoUnitToString(value: bigint, precision?: number): string

/**
 * Rounds gradido units to a specified number of decimal places.
 * @param value - The BigInt value to round (in gdd units)
 * @param places - The number of decimal places to round to
 * @returns The rounded BigInt value (in gdd units)
 */
export function toDecimalPlaces(value: bigint, places: number): bigint

/**
 * C function declarations for grdu_duration_string are found in
 * {@link include/gradido_blockchain_core/data/duration.h}
 */

/**
 * Converts a duration in nanoseconds to a string (for debugging purposes).
 * @param duration - The duration in nanoseconds
 * @param precision - The number of decimal places to include (max/default: 4)
 * @returns The string representation of the duration
 */
export function durationToString(duration: bigint, precision?: number): string

/**
 * C function declarations for grdc_sign_key_pair are found in
 * {@link include/gradido_blockchain_core/crypto/sign.h}
 */

export function signKeyPairGenerateFromSeed(seed: Uint8Array): Uint8Array

/**
 * @param index need to be >= 0x80000000 (hardend key)
 */
export function signKeyPairDerive(parentKeyPair: Uint8Array, index: number): Uint8Array

export function signKeyPairDeriveUuid(parentKeyPair: Uint8Array, uuid: Uint8Array): Uint8Array

/**
 * @brief Derive an account child key from community seed and user UUID.
 *
 * Performs a full derivation path starting from the community root seed,
 * deriving through the user UUID to arrive at a specific account key. The
 * account_index selects the account within the user's hierarchy, starting
 * from 1. This combines community, user, and account context into a single
 * deterministic key.
 *
 * @param communitySeed - 64-byte community root seed in hex
 * @param userUuid - user uuid in raw uuid form
 * @param accountNumber - account number of user, starting with 1 (contribution account), < 0x80000000
 * @returns Buffer containing 32 Bytes seed, 32 Bytes Public Key which together are the private Key and 32 Bytes chain code needed for key derivations
 */
export function signKeyPairDeriveAccountFromCommunity(
  communitySeed: Uint8Array,
  userUuid: Uint8Array,
  accountNumber: number = 1,
): Uint8Array

/**
 * C function declarations for grdc_hash are found in
 * {@link include/gradido_blockchain_core/crypto/hash.h}
 */

export function hashGeneric(data: Uint8Array): Uint8Array

/**
 * Gradido Blockchain Core – Enum Type Definitions
 *
 * These types mirror the C enum definitions from the blockchain core,
 * ensuring type safety across TypeScript, NAPI, and Bun FFI bindings.
 *
 * Each enum consists of:
 * - A readonly const array containing all valid string values (serves as
 *   the single source of truth and enables runtime validation)
 * - A TypeScript union type derived from that array (for compile‑time checks)
 * - A type guard function `isGrdt*Type(input)` that checks at runtime whether
 *   a given string is a valid member of the enum
 *
 * The indices of the arrays match the integer values of the corresponding
 * C enums, allowing direct bidirectional mapping between strings and integers
 * via the `grdt*ToString` helper functions declared below.
 *
 * Usage as function parameter:
 *   import { GrdtTransactionType } from 'shared-native'
 *   function processTransaction(type: GrdtTransactionType) {
 *     // TypeScript ensures only valid transaction type strings can be passed
 *   }
 *   processTransaction('GRDT_TRANSACTION_CREATION') // OK
 *   processTransaction('INVALID_TYPE')               // TypeScript error
 *
 * Usage with runtime validation:
 *   import { GRDT_TRANSACTION_TYPES, isGrdtTransactionType } from 'shared-native'
 *   if (isGrdtTransactionType(someString)) {
 *     // someString is now typed as GrdtTransactionType
 *   }
 *   const index = GRDT_TRANSACTION_TYPES.indexOf(someString) // → C enum value
 */
export const GRDT_ADDRESS_TYPES: readonly [
  'GRDT_ADDRESS_NONE',
  'GRDT_ADDRESS_COMMUNITY_HUMAN',
  'GRDT_ADDRESS_COMMUNITY_GMW',
  'GRDT_ADDRESS_COMMUNITY_AUF',
  'GRDT_ADDRESS_COMMUNITY_PROJECT',
  'GRDT_ADDRESS_SUBACCOUNT',
  'GRDT_ADDRESS_CRYPTO_ACCOUNT',
  'GRDT_ADDRESS_DEFERRED_TRANSFER',
]

export type GrdtAddressType = (typeof GRDT_ADDRESS_TYPES)[number]
export function isGrdtAddressType(input: string): input is GrdtAddressType

export const GRDT_BALANCE_DERIVATION_TYPES: readonly [
  'GRDT_BALANCE_DERIVATION_UNSPECIFIED',
  'GRDT_BALANCE_DERIVATION_NODE',
  'GRDT_BALANCE_DERIVATION_EXTERN',
]

export type GrdtBalanceDerivationType = (typeof GRDT_BALANCE_DERIVATION_TYPES)[number]
export function isGrdtBalanceDerivationType(input: string): input is GrdtBalanceDerivationType

export const GRDT_CROSS_GROUP_TYPES: readonly [
  'GRDT_CROSS_GROUP_LOCAL',
  'GRDT_CROSS_GROUP_INBOUND',
  'GRDT_CROSS_GROUP_OUTBOUND',
  'GRDT_CROSS_GROUP_CROSS',
]

export type GrdtCrossGroupType = (typeof GRDT_CROSS_GROUP_TYPES)[number]
export function isGrdtCrossGroupType(input: string): input is GrdtCrossGroupType

export const GRDT_LEDGER_ANCHOR_TYPES: readonly [
  'GRDT_LEDGER_ANCHOR_UNSPECIFIED',
  'GRDT_LEDGER_ANCHOR_IOTA_MESSAGE_ID', // not used any more, but stay for not disturbing indices
  'GRDT_LEDGER_ANCHOR_HIERO_TRANSACTION_ID',
  'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_TRANSACTION_ID',
  'GRDT_LEDGER_ANCHOR_NODE_TRIGGER_TRANSACTION_ID',
  'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_COMMUNITY_ID',
  'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_USER_ID',
  'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_CONTRIBUTION_ID',
  'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_TRANSACTION_LINK_ID',
]

export type GrdtLedgerAnchorType = (typeof GRDT_LEDGER_ANCHOR_TYPES)[number]
export function isGrdtLedgerAnchorType(input: string): input is GrdtLedgerAnchorType

export const GRDT_MEMO_KEY_TYPES: readonly [
  'GRDT_MEMO_KEY_SHARED_SECRET',
  'GRDT_MEMO_KEY_COMMUNITY_SECRET',
  'GRDT_MEMO_KEY_PLAIN',
]

export type GrdtMemoKeyType = (typeof GRDT_MEMO_KEY_TYPES)[number]
export function isGrdtMemoKeyType(input: string): input is GrdtMemoKeyType

export const GRDT_TRANSACTION_TYPES: readonly [
  'GRDT_TRANSACTION_NONE',
  'GRDT_TRANSACTION_CREATION',
  'GRDT_TRANSACTION_TRANSFER',
  'GRDT_TRANSACTION_COMMUNITY_FRIENDS_UPDATE',
  'GRDT_TRANSACTION_REGISTER_ADDRESS',
  'GRDT_TRANSACTION_DEFERRED_TRANSFER',
  'GRDT_TRANSACTION_COMMUNITY_ROOT',
  'GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER',
  'GRDT_TRANSACTION_TIMEOUT_DEFERRED_TRANSFER',
]

export type GrdtTransactionType = (typeof GRDT_TRANSACTION_TYPES)[number]
export function isGrdtTransactionType(input: string): input is GrdtTransactionType

// type helpers, used to test if TypeScript Enums and C-Enums are identical
export function grdtAddressToString(addressType: number): string
export function grdtBalanceDerivationToString(addressType: number): string
export function grdtCrossGroupToString(addressType: number): string
export function grdtLedgerAnchorToString(addressType: number): string
export function grdtMemoKeyToString(addressType: number): string
export function grdtTransactionToString(addressType: number): string

export class CompleteTransaction {
  public initFromProtobuf(serialized: Uint8Array, communityUuid: Uint8Array | string): void
  public validate(verifySignatures: boolean = true): void
  public getSenderPublicKey(): Uint8Array | null
  public getRecipientPublicKey(): Uint8Array | null
  public getSenderCommunityUuid(): string | null
  public getRecipientCommunityUuid(): string | null
  public getRegisteredAccount(): Uint8Array | null
  // return 0 if tx type hasn't amount
  public getAmount(): bigint
  public getAccountBalanceForPublicKey(
    publicKey: Uint8Array | string,
  ): { balance: bigint; communityUuid: string } | null
  public getTransactionType(): GrdtTransactionType
  public getTargetDate(): Date | null
  public getTimeoutDuration(): bigint
}

export class MonotonicTimer {
  public reset(): void
  public toString(): string
}
