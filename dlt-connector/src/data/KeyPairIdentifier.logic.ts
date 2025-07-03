import { MemoryBlock } from 'gradido-blockchain-js'
import { IdentifierAccount, IdentifierAccountInput, identifierAccountSchema } from '../schemas/account.schema'
import { ParameterError } from '../errors'
import * as v from 'valibot'

export class KeyPairIdentifierLogic {
  public identifier: IdentifierAccount
  public constructor(identifier: IdentifierAccountInput) {
    // check if data structure is like expected and fill in defaults
    this.identifier = v.parse(identifierAccountSchema, identifier)
  }

  isCommunityKeyPair(): boolean {
    return !this.identifier.seed && !this.identifier.account
  }

  isSeedKeyPair(): boolean {
    return this.identifier.seed !== undefined
  }

  isUserKeyPair(): boolean {
    return (
      this.identifier.seed === undefined &&
      this.identifier.account != undefined &&
      this.identifier.account.accountNr === 0
    )
  }

  isAccountKeyPair(): boolean {
    return (
      this.identifier.seed === undefined &&
      this.identifier.account != undefined &&
      this.identifier.account.accountNr > 0
    )
  }

  getSeed(): string {
    if (!this.identifier.seed) {
      throw new Error('get seed called on non seed key pair identifier, please check first with isSeedKeyPair()')
    }
    return this.identifier.seed.seed
  }

  getCommunityUuid(): string {
    return this.identifier.communityUuid
  }

  getUserUuid(): string {
    if (!this.identifier.account) {
      throw new Error(
        'get user uuid called on non user key pair identifier, please check first with isUserKeyPair() or isAccountKeyPair()'
      )
    }
    return this.identifier.account.userUuid
  }

  getAccountNr(): number {
    if (!this.identifier.account?.accountNr) {
      throw new Error(
        'get account nr called on non account key pair identifier, please check first with isAccountKeyPair()'
      )
    }
    return this.identifier.account.accountNr
  }

  getSeedKey(): string { return this.getSeed() }
  getCommunityKey(): string { return this.getCommunityUuid() }
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
    if (!this.identifier.account?.userUuid || !this.identifier.communityUuid) {
      throw new ParameterError('userUuid and/or communityUuid is undefined')
    }
    const resultHexString = 
      this.identifier.communityUuid.replace(/-/g, '')  
      + this.identifier.account.userUuid.replace(/-/g, '')
    return MemoryBlock.fromHex(resultHexString).calculateHash().convertToHex()
  }
}
