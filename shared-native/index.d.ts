/// <reference types="node" />

/**
 * Hand-written declarations for the Node-API addon in `napi/`, plus the enum tables in
 * `types/` that `index.cjs` merges into the same module.
 *
 * The C side is not vendored any more: `gradido-blockchain-core` is a zig package declared
 * in `build.zig.zon`, and the general-purpose half of it -- the arena allocator, the timer,
 * the duration and hex/uuid conversions -- lives in `arnm`. Header references below name
 * the file inside whichever of the two owns it.
 *
 * Result codes surfaced as `error.name` therefore read `ARNM_*` (arnm/result.h) or
 * `GRD_ERROR_PB_*` (gradido_blockchain_core/result.h), never the old `GRD_*` general ones.
 */

/**
 * gradido_blockchain_core/data/unit.h
 */

/**
 * Returns the decay start time as a JavaScript Date object.
 */
export function getDecayStartTime(): Date
export function getDecayRespiteCent(): bigint

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
 * C function declarations for arnm_duration_string are found in
 * arnm/duration.h
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
 * gradido_blockchain_core/crypto/sign.h
 */

/**
 * Derive the master key pair of a SLIP-10 tree from a seed.
 *
 * @param seed - between 16 and 64 bytes, the SLIP-10 range; anything else is refused
 * @returns 96 bytes: 32 bytes seed, 32 bytes public key, 32 bytes chain code
 */
export function signKeyPairGenerateFromSeed(seed: Uint8Array): Uint8Array

/**
 * @param parentKeyPair - the 96 bytes a previous derivation returned
 * @param index - the plain index, < 0x80000000. Derivation is always hardened; the
 *   hardening bit is set by the core, so passing it here is an error.
 */
export function signKeyPairDerive(parentKeyPair: Uint8Array, index: number): Uint8Array

/**
 * @param parentKeyPair - the 96 bytes a previous derivation returned
 * @param uuid - 16 bytes, a uuid in its raw binary form
 */
export function signKeyPairDeriveUuid(parentKeyPair: Uint8Array, uuid: Uint8Array): Uint8Array

/**
 * Derive an account child key from community seed and user UUID.
 *
 * Performs a full derivation path starting from the community root seed,
 * deriving through the user UUID to arrive at a specific account key. The
 * account_index selects the account within the user's hierarchy, starting
 * from 1. This combines community, user, and account context into a single
 * deterministic key.
 *
 * @param communitySeed - 32-byte community root seed in raw binary form
 * @param userUuid - user uuid in raw uuid form (16 bytes)
 * @param accountNumber - account number of user, starting with 1 (contribution account), < 0x80000000, defaults to 1
 * @returns Buffer containing 32 Bytes seed, 32 Bytes Public Key which together are the private Key and 32 Bytes chain code needed for key derivations
 */
export function signKeyPairDeriveAccountFromCommunity(
  communitySeed: Uint8Array,
  userUuid: Uint8Array,
  accountNumber?: number,
): Uint8Array

/**
 * C function declarations for grdc_hash are found in
 * gradido_blockchain_core/crypto/hash.h
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
export function grdtCrossGroupToString(addressType: number): string
export function grdtLedgerAnchorToString(addressType: number): string
export function grdtMemoKeyToString(addressType: number): string
export function grdtTransactionToString(addressType: number): string

/**
 * The error carried by a VoidResult is a plain object, not an `Error` instance: it crosses
 * from C as a name and a message rather than being thrown.
 */
export type NativeError = { name: string; message: string }

/**
 * What a failing `validate()` reports. `actual` and `expected` are filled in only where the
 * check that failed had two values to name.
 */
export type ErrorDetails = NativeError & { actual?: string; expected?: string }

export type Result<T, E = NativeError> = { success: true; value: T } | { success: false; error: E }
export type VoidResult<E = NativeError> = { success: true } | { success: false; error: E }

export class LedgerAnchor {
  public static createFromHieroTransactionId(
    transactionValidStart: { seconds: bigint; nanos?: number },
    hieroAccountId: { accountNum: bigint; shardNum?: bigint; realmNum?: bigint },
  ): LedgerAnchor
  public getType(): GrdtLedgerAnchorType
  public isLegacy(): boolean
  public isNodeTrigger(): boolean
  public isHieroTransactionId(): boolean
  public getLegacyId(): bigint
  public getNodeTriggerId(): bigint
  public getHieroTransactionId(): string | null
}

export class NativeCompleteTransaction {
  /**
   * @param serialized - a serialized ConfirmedTransaction protobuf
   * @param communityUuid - the uuid of the community the transaction belongs to, either raw
   *   (16 bytes) or in canonical 8-4-4-4-12 form (36 characters)
   */
  public initFromProtobuf(serialized: Uint8Array, communityUuid: Uint8Array | string): VoidResult
  /**
   * @param verifySignatures - defaults to true; false skips signature verification and checks
   *   only the structure
   */
  public validate(verifySignatures?: boolean): VoidResult<ErrorDetails>
  public getConfirmedAt(): Date
  public getCreatedAt(): Date
  public getLedgerAnchor(): LedgerAnchor
  public getSenderPublicKey(): Uint8Array | null
  public getRecipientPublicKey(): Uint8Array | null
  public getSenderCommunityUuid(): string | null
  public getRecipientCommunityUuid(): string | null
  public getRegisteredAccount(): Uint8Array | null
  // return 0 if tx type hasn't amount
  public getAmount(): bigint
  /**
   * @param publicKey - raw (32 bytes) or as a 64 character hex string
   */
  public getAccountBalanceForPublicKey(
    publicKey: Uint8Array | string,
  ): { balance: bigint; publicKey: Uint8Array; coinCommunityUuid: string } | null
  public getTransactionType(): GrdtTransactionType
  public getTargetDate(): Date | null
  public getTimeoutDuration(): bigint
}

/**
 * A high-precision monotonic timer for simple performance measurements.
 *
 * This timer captures a reference point in time upon creation or reset, and allows
 * formatting the elapsed time since that reference point as a human-readable string.
 * It automatically selects the most appropriate time unit for the duration.
 *
 * @example
 * ```ts
 * const timer = new MonotonicTimer()
 *
 * // Perform some expensive operation...
 * doHeavyWork()
 *
 * console.log(timer) // "1.2345 ms" (implicitly calls toString)
 * console.log(timer.toString()) // "1.2345 ms"
 * console.log(`Time: ${timer}`) // "Time: 1.2345 ms"
 * ```
 */
export class MonotonicTimer {
  /**
   * Captures the current monotonic time as a reference point.
   *
   * The timer starts measuring from this moment. Subsequent calls to `toString()`
   * will report the elapsed time since this instant.
   */
  public constructor()

  /**
   * Resets the timer by capturing a new reference point.
   *
   * After calling `reset()`, subsequent calls to `toString()` will measure
   * elapsed time from this new moment. This is useful for measuring multiple
   * independent tasks with the same timer instance.
   *
   * @example
   * ```ts
   * const timer = new MonotonicTimer()
   * doTask1()
   * console.log(`Task 1: ${timer}`) // "Task 1: 42.1234 ms"
   *
   * timer.reset()
   * doTask2()
   * console.log(`Task 2: ${timer}`) // "Task 2: 15.6789 ms"
   * ```
   */
  public reset(): void

  /**
   * Formats the elapsed time since the last reset or creation as a human-readable string.
   *
   * The function automatically selects the most appropriate unit based on the duration.
   * Values are always formatted with 4 decimal places of precision.
   *
   * @returns A string representation of the elapsed time (e.g., `"123.4567 ms"`)
   *
   * @example
   * ```ts
   * const timer = new MonotonicTimer()
   * await new Promise(resolve => setTimeout(resolve, 150))
   *
   * console.log(timer.toString()) // "150.0234 ms"
   * console.log(`${timer}`)       // "150.0234 ms" (implicit conversion)
   * ```
   */
  public toString(): string
}

/**
 * rust-image-ffi {@link https://github.com/gradido/rust-image-ffi}, C function declarations in
 * its `rust_image_ffi.h`. The object is a prebuild, fetched by zig and pinned in build.zig.zon.
 */

export type ImageFormat = 'jpeg' | 'png' | 'webp'

export interface ReencodeImageOptions {
  /**
   * The byte budget: the most the re-encoded picture may take. One that needs more is answered
   * with `RIMG_ERR_BUFFER_TOO_SMALL`. It is a limit, not a reservation: the memory taken follows
   * the size the picture's header says, up to this.
   */
  maxOutputBytes: number
  /** Which formats may come in. Default: `['jpeg']` — every format is one more decoder reading hostile bytes. */
  inputFormats?: ImageFormat[]
  /** Default: `'jpeg'` */
  outputFormat?: 'jpeg' | 'png'
  /** Limits on the picture as stored, before orientation. 0 means no limit. Default: 8192 */
  maxWidth?: number
  maxHeight?: number
  /** 0 means no limit. Default: 16 000 000 */
  maxPixels?: number
  /** What decoding may allocate for pixels. 0 means no limit. Default: 128 MiB */
  maxAllocBytes?: number
  /**
   * 1 to 100, only for JPEG output. Default: 85. With `jpegQualityFromInput`, which is the
   * default, it is the highest quality that is used rather than the one that always is.
   */
  jpegQuality?: number
  /**
   * A JPEG is not encoded at a higher quality than it came in with: the quality is the lower of
   * `jpegQuality` and the input's (`inputJpegQuality`). More than the input's quality buys no
   * picture, only bytes. Where the input's quality is unknown — a PNG, a WebP — `jpegQuality`
   * is used. false: always `jpegQuality`. Only for JPEG output. Default: true
   */
  jpegQualityFromInput?: boolean
  /**
   * Store color at half resolution in both directions (4:2:0), as cameras and browsers do.
   * false: full resolution (4:4:4), a third larger and sharper at colored edges — for drawings
   * and text rather than photos. Only for JPEG output. Default: true
   */
  jpegSubsampling?: boolean
  /** Turn the pixels the way the EXIF orientation says; the tag itself never survives. Default: true */
  applyOrientation?: boolean
  /** [red, green, blue] that transparent pixels are laid over for JPEG output. Default: white */
  background?: [number, number, number]
}

export interface ReencodedImage {
  data: Buffer
  inputFormat: ImageFormat
  /** Width and height of the picture as it was encoded, after orientation */
  width: number
  height: number
  /** The input carries an alpha channel */
  hasAlpha: boolean
  /**
   * For a JPEG: the quality, 1 to 100, whose standard quantization tables are nearest the ones
   * in the file — the number a browser or libjpeg wrote it with, an estimate for an encoder
   * with tables of its own. 0: not a JPEG, or one without tables before its first scan.
   */
  inputJpegQuality: number
}

export type ReencodeImageErrorName =
  | 'RIMG_ERR_BUFFER_TOO_SMALL'
  | 'RIMG_ERR_NO_MEMORY'
  | 'RIMG_ERR_UNSUPPORTED'
  | 'RIMG_ERR_DECODE'
  | 'RIMG_ERR_LIMIT'
  | 'RIMG_ERR_ENCODE'
  | 'RIMG_ERR_PANIC'

export type ReencodeImageError = {
  name: ReencodeImageErrorName
  message: string
  /** Only with `RIMG_ERR_BUFFER_TOO_SMALL`: what the picture needs at this quality */
  requiredBytes?: number
  /** Only with `RIMG_ERR_BUFFER_TOO_SMALL`: as in `ReencodedImage`, to pick the next quality by */
  inputJpegQuality?: number
}

export interface ProbedImage {
  format: ImageFormat
  /** Width and height as stored, before orientation */
  width: number
  height: number
  hasAlpha: boolean
  /**
   * For a JPEG: the quality, 1 to 100, whose standard quantization tables are nearest the ones
   * in the file — the number a browser or libjpeg wrote it with, an estimate for an encoder
   * with tables of its own. 0: not a JPEG, or one without tables before its first scan.
   */
  inputJpegQuality: number
}

export type ProbeImageError = { name: ReencodeImageErrorName; message: string }

/**
 * Reads the header only: which format the first bytes say and the size as stored. No limits and
 * no format set apply — it answers what is there, so that a caller can refuse in its own words.
 * It proves nothing about the rest of the data.
 */
export function probeImage(input: Uint8Array): Result<ProbedImage, ProbeImageError>

/**
 * Decodes a picture nobody vouches for under hard limits and encodes its pixels again, on a
 * worker thread. Nothing of the input's container survives: no EXIF, ICC profile, comment or
 * text chunk, no bytes behind the end marker. The format is decided on the first bytes. Of an
 * animated picture only the first frame is taken; there is no scaling.
 *
 * A picture that is refused is an expected failure and comes back as `success: false`. Wrong
 * arguments throw. On a target rust-image-ffi has no prebuild for (32 bit) it always throws.
 */
export function reencodeImage(
  input: Uint8Array,
  options: ReencodeImageOptions,
): Promise<Result<ReencodedImage, ReencodeImageError>>

/**
 * napi/appContext.h, napi/passwordHashing.h: libsodium, which comes in through the core.
 */

export interface PasswordHashingOptions {
  /**
   * ⛔ argon2id passes. Default 10, and that is a constant of the derivation, not tuning:
   * every hash in users.password was derived with it, and a hash derived with another value
   * matches no stored password. Lower it for tests only, where no hash is ever compared with
   * a production one; argon2id's minimum is 1.
   */
  opsLimit?: number
  /** ⛔ argon2id memory in bytes, the same warning as `opsLimit`. Default 32 MiB, minimum 8192 */
  memLimit?: number
  /** Threads that derive password keys. Default: half the logical cores, at least one */
  threadCount?: number
}

export interface NativeAppContextOptions {
  /** The salt component every derivation starts from; the backend's LOGIN_APP_SECRET */
  appSecret: Uint8Array
  /** 16 bytes, crypto_shorthash_KEYBYTES; the backend's LOGIN_SERVER_KEY */
  serverKey: Uint8Array
  passwordHashing?: PasswordHashingOptions
}

export interface PasswordHashingStats {
  threadCount: number
  /** The admission rule: what a job queued now may be expected to wait at most, 3500 */
  maxExpectedWaitMs: number
  /** Over the last five derivations on this hardware; the first one is run at start */
  averageDurationMs: number
  /** What a job queued now would wait before its own derivation starts, by the admission rule */
  expectedWaitMs: number
  highPriorityQueued: number
  lowPriorityQueued: number
}

export type PasswordHashQueueFullError = { name: 'PASSWORD_HASH_QUEUE_FULL'; message: string }

/**
 * What the process is configured with once, at start, and never changes while it runs: the
 * secrets every password and PIN derivation is keyed with, and the threads that derive
 * password keys. One instance per process, held by the AppContext of `shared`; the secrets
 * are copied in and never leave the native side again.
 *
 * Password keys are derived on the context's own threads, fed from two queues. Admission is
 * by time, not by places: a job is admitted while what is queued already would be served
 * within `maxExpectedWaitMs` -- the queued jobs times the average duration of the last
 * derivations on this hardware, spread over the threads. One over that is refused at once,
 * so the server answers "try again later" rather than piling up logins it cannot serve.
 *
 * The threads prefer the high priority queue, but while both queues wait every third pick
 * goes to the low one, so a run of logins cannot starve the password changes.
 */
export class NativeAppContext {
  public constructor(options: NativeAppContextOptions)

  /**
   * The password derivation: sha512(salt + appSecret) as the argon2id salt, argon2id over the
   * password, crypto_shorthash of that keyed with the server key -- a 64 bit value, the shape
   * users.password stores.
   *
   * @param priority - 0 for the high priority queue (the login), 1 for the low one (everything
   *   else); `PasswordHashPriority` in `shared` names them
   * @returns at once whether the job was admitted; its promise resolves with the key, and
   *   rejects only if libsodium could not derive one (out of memory)
   */
  public hashPassword(
    salt: string,
    password: string,
    priority: number,
  ): Result<Promise<bigint>, PasswordHashQueueFullError>

  /**
   * The thank-you-card PIN derivation: keyed BLAKE2b over salt + appSecret + pin, keyed with
   * the server key, cut to 64 bit. Microseconds, so it runs on the calling thread.
   */
  public derivePinKey(salt: string, pin: string): bigint

  public getPasswordHashingStats(): PasswordHashingStats

  /**
   * Finishes the derivations the threads are on, drops the queued ones -- their promises
   * stay pending -- and joins the threads. After it, `hashPassword` throws. Not needed for
   * the process to exit: an idle context does not keep the event loop alive.
   */
  public destroy(): void
}
