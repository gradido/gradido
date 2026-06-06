import {
  signKeyPairDerive,
  signKeyPairDeriveAccountFromCommunity,
  signKeyPairDeriveUuid,
  signKeyPairGenerateFromSeed,
} from 'shared-native'

/**
 * TODO: move diagram into separate md file for auto rendering on github
 * ```mermaid
 * classDiagram
 *   class SignKeyPair {
 *     #keyData: Uint8Array
 *     +constructor(keyData: Uint8Array)
 *     +get publicKey(): Uint8Array
 *     +get chainCode(): Uint8Array
 *     +get privateKey(): Uint8Array
 *     +toBytes(): Uint8Array
 *   }
 *
 *   class CommunityKeyPair {
 *     +constructor(keyData: Uint8Array)
 *     +static fromSeed(seed: string): CommunityKeyPair
 *     +deriveUserKeyPair(userUuid: string): UserKeyPair
 *   }
 *
 *   class UserKeyPair {
 *     +constructor(keyData: Uint8Array)
 *     +deriveAccountKeyPair(accountNumber: number): AccountKeyPair
 *     +static fromSeedAndUserUuid(seed: string, userUuid: string): UserKeyPair
 *   }
 *
 *   class AccountKeyPair {
 *     +constructor(keyData: Uint8Array)
 *     +static fromSeedAndUserUuidAndAccountNumber(communityRootSeed: string, userUuid: string, accountNumber: number): AccountKeyPair
 *   }
 *
 *   SignKeyPair <|-- CommunityKeyPair : extends
 *   SignKeyPair <|-- UserKeyPair : extends
 *   SignKeyPair <|-- AccountKeyPair : extends
 *
 *   CommunityKeyPair ..> UserKeyPair : derives
 *   UserKeyPair ..> AccountKeyPair : derives
 *
 *   note for CommunityKeyPair "First step on derivation path.\nCreated from community root seed."
 *   note for UserKeyPair "Second step on derivation path.\nDerived from CommunityKeyPair using user UUID."
 *   note for AccountKeyPair "Third step on derivation path.\nDerived from UserKeyPair using account number."
 *   note for SignKeyPair "Base class holding raw 96-byte key data.\nProvides access to public, private, and chain code."
 * ```
 */

// ed25519 key pair which can be derived by slip0010 using blockchain core as native c module
export class SignKeyPair {
  protected readonly keyData: Uint8Array

  constructor(keyData: Uint8Array) {
    if (keyData.length !== 96) {
      throw new Error(`Key data must be 96 bytes, got ${keyData.length}`)
    }
    this.keyData = keyData
  }

  get publicKey(): Uint8Array {
    return this.keyData.slice(32, 64)
  }
  get chainCode(): Uint8Array {
    return this.keyData.slice(64, 96)
  }
  get privateKey(): Uint8Array {
    return this.keyData.slice(0, 64)
  }
  toBytes(): Uint8Array {
    return this.keyData
  }
}

// #### Community Key Pair ####
// first step on derivation path to account key pair
export class CommunityKeyPair extends SignKeyPair {
  static fromSeed(seed: string): CommunityKeyPair {
    return new CommunityKeyPair(
      signKeyPairGenerateFromSeed(new Uint8Array(Buffer.from(seed, 'hex'))),
    )
  }
  public deriveUserKeyPair(userUuid: string): UserKeyPair {
    const userUuidRaw = new Uint8Array(Buffer.from(userUuid.replace(/-/g, ''), 'hex'))
    return new UserKeyPair(signKeyPairDeriveUuid(this.keyData, userUuidRaw))
  }
}

// #### User Key Pair ####
// second step on derivation path to account key pair
export class UserKeyPair extends SignKeyPair {
  public deriveAccountKeyPair(accountNumber: number): AccountKeyPair {
    return new AccountKeyPair(signKeyPairDerive(this.keyData, accountNumber))
  }

  static fromSeedAndUserUuid(seed: string, userUuid: string): UserKeyPair {
    const communityKeyPair = CommunityKeyPair.fromSeed(seed)
    const userUuidRaw = new Uint8Array(Buffer.from(userUuid.replace(/-/g, ''), 'hex'))
    return new UserKeyPair(signKeyPairDeriveUuid(communityKeyPair.toBytes(), userUuidRaw))
  }
}

// #### Account Key Pair ####
// third step on derivation path to account key pair
export class AccountKeyPair extends SignKeyPair {
  // from community root seed and account number
  static fromSeedAndUserUuidAndAccountNumber(
    communityRootSeed: string,
    userUuid: string,
    accountNumber = 1,
  ): AccountKeyPair {
    const communityRootSeedRaw = new Uint8Array(Buffer.from(communityRootSeed, 'hex'))
    const userUuidRaw = new Uint8Array(Buffer.from(userUuid.replace(/-/g, ''), 'hex'))
    return new AccountKeyPair(
      signKeyPairDeriveAccountFromCommunity(communityRootSeedRaw, userUuidRaw, accountNumber),
    )
  }
}
