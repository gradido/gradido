import { DbUser, User } from 'database'
import XRegExp from 'xregexp'
import { PublishNameType } from '@/graphql/enum/PublishNameType'
import { gradidoIdOf } from './UserLogic'

export class PublishNameLogic {
  // allowed characters for humhub usernames
  private usernameRegex: RegExp = XRegExp('[\\p{L}\\d_\\-@\\.]', 'g')

  constructor(private user: DbUser | User) {}

  private get gradidoId(): string {
    return gradidoIdOf(this.user)
  }

  // remove character which are invalid for humhub username
  private filterOutInvalidChar(name: string) {
    return XRegExp.match(name, this.usernameRegex, 'all').join('')
  }

  /**
   * What another member is allowed to call this one (NU-018/NU-024): the alias, which
   * every row carries since migration 0164. No publish-name setting steers it -- that
   * setting's display role ended with NU-024, and the real name is not handed out here
   * at all.
   *
   * A method for a field read, because the call sites hold a whole user: while the alias
   * could still be missing, reading it off the user at each of them is what let the
   * fallback drift between them.
   */
  public getPublicAlias(): string {
    return this.user.alias
  }

  /**
   * get unique username
   * @param publishNameType
   * @return the alias, reduced to what humhub accepts, for PUBLISH_NAME_ALIAS_OR_INITALS;
   * else the gradido id
   */
  public getUserIdentifier(publishNameType: PublishNameType): string {
    return this.isUsernameFromAlias(publishNameType) ? this.getUsernameFromAlias() : this.gradidoId
  }

  public getUsernameFromAlias(): string {
    return this.filterOutInvalidChar(this.user.alias)
  }

  public isUsernameFromAlias(publishNameType: PublishNameType): boolean {
    return PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS === publishNameType
  }
}
