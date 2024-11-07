export class UserIdentifier {
  uuid: string
  communityUuid: string
  accountNr?: number

  constructor(uuid: string, communityUuid: string, accountNr?: number) {
    this.uuid = uuid
    this.communityUuid = communityUuid
    this.accountNr = accountNr
  }
}
