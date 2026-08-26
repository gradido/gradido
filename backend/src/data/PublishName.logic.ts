import { User } from 'database'
import { ALIAS_MIN_CHARS, publicAlias } from 'shared'
import XRegExp from 'xregexp'

import { PublishNameType } from '@/graphql/enum/PublishNameType'

export class PublishNameLogic {
  // allowed characters for humhub usernames
  private usernameRegex: RegExp = XRegExp('[\\p{L}\\d_\\-@\\.]', 'g')

  constructor(private user: User) {}

  // remove character which are invalid for humhub username
  private filterOutInvalidChar(name: string) {
    return XRegExp.match(name, this.usernameRegex, 'all').join('')
  }

  /**
   * Whether this member has an alias worth using -- for the humhub username, which is
   * what `getUserIdentifier` builds.
   *
   * The threshold comes from `ALIAS_MIN_CHARS` rather than a literal `3`. It stood here
   * as a literal while `publicAlias` in `shared` read the constant: two copies of one
   * number, in a class that had just been made to delegate. Measured the same way too,
   * on the trimmed length, so the two cannot disagree about an alias of three spaces.
   */
  public hasAlias(): boolean {
    if (this.user.alias && this.user.alias.trim().length >= ALIAS_MIN_CHARS) {
      return true
    }
    return false
  }

  /**
   * What another member is allowed to call this one (NU-018/NU-024): the alias, and
   * without one the FULL gradidoID. No publish-name setting steers it -- that setting's
   * display role ended with NU-024, and the real name is not handed out here at all.
   *
   * ⛔ The single place this rule lives on the server. It sat inline at four call sites
   * that all had to agree, and one of them (the till's receipt) had already drifted to a
   * bare `alias || gradidoID` -- which let a legacy alias of one or two characters
   * through where the other three showed the identifier. They all come through here now.
   *
   * ⚠️ Not through `hasAlias()`, which is what this said until the rule moved to
   * `shared`. That method answers a different question -- whether an alias can become a
   * humhub username -- and only shares the threshold with this one.
   *
   * ⛔ Delegates to `shared`, it does not repeat the rule: `core` writes the same value
   * into the mails a third party reads and cannot import this class, so the rule had to
   * move somewhere all three packages reach. This method stays because the call sites
   * here hold a whole user and reading two fields off it at each of them is what let the
   * rule drift in the first place.
   *
   * Never null: the entity's types lie -- `alias` is declared `string` while the column
   * is nullable -- and `Profile` puts the result straight into a `.length` check, where
   * undefined is a crash rather than a blank.
   *
   * Exempt from Result on purpose: every user produces an answer, there is no failure
   * to model.
   */
  public getPublicAlias(): string {
    return publicAlias(this.user.alias, this.user.gradidoID)
  }

  /**
   * get unique username
   * @param publishNameType
   * @return when alias if exist and publishNameType = [PUBLISH_NAME_ALIAS_OR_INITALS, PUBLISH_NAME_INITIALS]
   * return alias
   * else return gradido id
   */
  public getUserIdentifier(publishNameType: PublishNameType): string {
    return this.isUsernameFromAlias(publishNameType)
      ? this.getUsernameFromAlias()
      : this.user.gradidoID
  }

  public getUsernameFromAlias(): string {
    return this.filterOutInvalidChar(this.user.alias)
  }

  public isUsernameFromAlias(publishNameType: PublishNameType): boolean {
    return PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS === publishNameType && this.hasAlias()
  }
}
