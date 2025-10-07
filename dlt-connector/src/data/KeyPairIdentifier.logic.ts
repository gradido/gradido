import { MemoryBlock } from 'gradido-blockchain-js'
import { ParameterError } from '../errors'
import { IdentifierAccount } from '../schemas/account.schema'
import { HieroId } from '../schemas/typeGuard.schema'

export class KeyPairIdentifierLogic {
  public constructor(public identifier: IdentifierAccount) {}

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

  getSeed(): string {
    if (!this.identifier.seed) {
      throw new Error(
        'get seed called on non seed key pair identifier, please check first with isSeedKeyPair()',
      )
    }
    return this.identifier.seed.seed
  }

  getCommunityTopicId(): HieroId {
    return this.identifier.communityTopicId
  }

  getUserUuid(): string {
    if (!this.identifier.account) {
      throw new Error(
        'get user uuid called on non user key pair identifier, please check first with isUserKeyPair() or isAccountKeyPair()',
      )
    }
    return this.identifier.account.userUuid
  }

  getAccountNr(): number {
    if (!this.identifier.account?.accountNr) {
      throw new Error(
        'get account nr called on non account key pair identifier, please check first with isAccountKeyPair()',
      )
    }
    return this.identifier.account.accountNr
  }

  getSeedKey(): string {
    return this.getSeed()
  }
  getCommunityKey(): HieroId {
    return this.getCommunityTopicId()
  }
  getCommunityUserKey(): string {
    return this.createCommunityUserHash()
  }
  getCommunityUserAccountKey(): string {
    return this.createCommunityUserHash() + this.getAccountNr().toString()
  }

  getKey(): string {
    if (this.isSeedKeyPair()) {
      return this.getSeedKey()
    } else if (this.isCommunityKeyPair()) {
      return this.getCommunityKey()
    } else if (this.isUserKeyPair()) {
      return this.getCommunityUserKey()
    } else if (this.isAccountKeyPair()) {
      return this.getCommunityUserAccountKey()
    }
    throw new ParameterError('KeyPairIdentifier: unhandled input type')
  }

  private createCommunityUserHash(): string {
    if (!this.identifier.account?.userUuid || !this.identifier.communityTopicId) {
      throw new ParameterError('userUuid and/or communityTopicId is undefined')
    }
    const resultHexString =
      this.identifier.communityTopicId + this.identifier.account.userUuid.replace(/-/g, '')
    return MemoryBlock.fromHex(resultHexString).calculateHash().convertToHex()
  }
}
