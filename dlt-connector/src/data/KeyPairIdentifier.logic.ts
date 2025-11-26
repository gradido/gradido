import { MemoryBlock } from 'gradido-blockchain-js'
import { InvalidCallError, ParameterError } from '../errors'
import { IdentifierKeyPair } from '../schemas/account.schema'
import { HieroId, IdentifierSeed, Uuidv4 } from '../schemas/typeGuard.schema'

/**
 * @DCI-Logic
 * Domain logic for identifying and classifying key pairs used in the Gradido blockchain.
 *
 * This logic determines the type of key pair (community, user, account, or seed)
 * and provides deterministic methods for deriving consistent cache keys and hashes.
 * It is pure, stateless, and guaranteed to operate on validated input
 * (checked beforehand by Valibot using {@link identifierKeyPairSchema}).
 *
 * Responsibilities:
 *  - Identify key pair type via `isCommunityKeyPair()`, `isUserKeyPair()`, `isAccountKeyPair()`, or `isSeedKeyPair()`
 *  - Provide derived deterministic keys for caching or retrieval
 *    (e.g. `getCommunityUserKey()`, `getCommunityUserAccountKey()`)
 *  - or simple: `getKey()` if you don't need to know the details
 *  - Ensure that invalid method calls throw precise domain-specific errors
 *    (`InvalidCallError` for misuse, `ParameterError` for unexpected input)
 */
export class KeyPairIdentifierLogic {
  public constructor(public identifier: IdentifierKeyPair) {}

  isCommunityKeyPair(): boolean {
    return !this.identifier.seed && !this.identifier.account
  }

  isSeedKeyPair(): boolean {
    return this.identifier.seed !== undefined
  }

  isUserKeyPair(): boolean {
    return (
      this.identifier.seed === undefined &&
      this.identifier.account != null &&
      this.identifier.account.accountNr === 0
    )
  }

  isAccountKeyPair(): boolean {
    return (
      this.identifier.seed === undefined &&
      this.identifier.account != null &&
      this.identifier.account.accountNr > 0
    )
  }

  getSeed(): IdentifierSeed {
    if (!this.identifier.seed) {
      throw new InvalidCallError('Invalid call: getSeed() on non-seed identifier')
    }
    return this.identifier.seed
  }

  getCommunityTopicId(): HieroId {
    return this.identifier.communityTopicId
  }

  getUserUuid(): Uuidv4 {
    if (!this.identifier.account) {
      throw new InvalidCallError('Invalid call: getUserUuid() on non-user identifier')
    }
    return this.identifier.account.userUuid
  }

  getAccountNr(): number {
    if (!this.identifier.account) {
      throw new InvalidCallError('Invalid call: getAccountNr() on non-account identifier')
    }
    return this.identifier.account.accountNr
  }

  getSeedKey(): string {
    return this.getSeed()
  }
  getCommunityKey(): string {
    return this.getCommunityTopicId()
  }
  getCommunityUserKey(): string {
    return this.deriveCommunityUserHash(0)
  }
  getCommunityUserAccountKey(): string {
    return this.deriveCommunityUserHash(this.getAccountNr())
  }

  getKey(): string {
    switch (true) {
      case this.isSeedKeyPair():
        return this.getSeedKey()
      case this.isCommunityKeyPair():
        return this.getCommunityKey()
      case this.isUserKeyPair():
        return this.getCommunityUserKey()
      case this.isAccountKeyPair():
        return this.getCommunityUserAccountKey()
      default:
        throw new ParameterError('KeyPairIdentifier: unhandled input constellation')
    }
  }

  private deriveCommunityUserHash(accountNr: number): string {
    if (!this.identifier.account) {
      throw new InvalidCallError(
        'Invalid call: getCommunityUserKey or getCommunityUserAccountKey() on non-user/non-account identifier',
      )
    }
    const resultString =
      this.identifier.communityTopicId +
      this.identifier.account.userUuid.replace(/-/g, '') +
      accountNr.toString()
    return new MemoryBlock(resultString).calculateHash().convertToHex()
  }
}
