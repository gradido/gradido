import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { LogError } from '@/server/LogError'
import { uuid4sToMemoryBlock } from '@/utils/typeConverter'

export class KeyPairIdentifier {
  // used for community key pair if it is only parameter or for user key pair
  communityUuid?: string
  // if set calculate key pair from seed, ignore all other parameter
  seed?: string
  // used for user key pair and account key pair, need also communityUuid
  userUuid?: string
  // used for account key pair, need also userUuid
  accountNr?: number

  public constructor(input: UserIdentifier | string | undefined = undefined) {
    if (input instanceof UserIdentifier) {
      if (input.seed !== undefined) {
        this.seed = input.seed.seed
      } else {
        this.communityUuid = input.communityUuid
        this.userUuid = input.communityUser?.uuid
        this.accountNr = input.communityUser?.accountNr
      }
    } else if (typeof input === 'string') {
      this.communityUuid = input
    }
  }

  isCommunityKeyPair(): boolean {
    return this.communityUuid !== undefined && this.userUuid === undefined
  }

  isSeedKeyPair(): boolean {
    return this.seed !== undefined
  }

  isUserKeyPair(): boolean {
    return (
      this.communityUuid !== undefined &&
      this.userUuid !== undefined &&
      this.accountNr === undefined
    )
  }

  isAccountKeyPair(): boolean {
    return (
      this.communityUuid !== undefined &&
      this.userUuid !== undefined &&
      this.accountNr !== undefined
    )
  }

  getKey(): string {
    if (this.seed && this.isSeedKeyPair()) {
      return this.seed
    } else if (this.communityUuid && this.isCommunityKeyPair()) {
      return this.communityUuid
    }
    if (this.userUuid && this.communityUuid) {
      const communityUserHash = uuid4sToMemoryBlock([this.userUuid, this.communityUuid])
        .calculateHash()
        .convertToHex()
      if (this.isUserKeyPair()) {
        return communityUserHash
      }
      if (this.accountNr && this.isAccountKeyPair()) {
        return communityUserHash + this.accountNr.toString()
      }
    }
    throw new LogError('KeyPairIdentifier: unhandled input type', this)
  }
}
