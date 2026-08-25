import { GmsPublishLocationType } from '@enum/GmsPublishLocationType'
import { PublishNameType } from '@enum/PublishNameType'
import { User as DbUser } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'
import { Point } from 'typeorm'

import { avatarColorIndex } from '@/data/AvatarColor.logic'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { Point2Location } from '@/graphql/resolver/util/Location2Point'

import { KlickTipp } from './KlickTipp'
import { Location } from './Location'
import { UserContact } from './UserContact'

@ObjectType()
export class User {
  constructor(dbUser: DbUser | null) {
    if (dbUser) {
      this.id = dbUser.id
      this.foreign = dbUser.foreign
      this.communityUuid = dbUser.communityUuid
      if (dbUser.community) {
        this.communityName = dbUser.community.name
      }
      this.gradidoID = dbUser.gradidoID
      this.alias = dbUser.alias

      const publishNameLogic = new PublishNameLogic(dbUser)
      const publishNameType = dbUser.humhubPublishName as PublishNameType
      // The alias for everyone (the full gradidoID without one, NU-018). This used to
      // follow the old publish-name setting, whose display role ended with NU-024 -- a
      // member who once picked "full name" for HumHub would otherwise keep handing their
      // real name to any signed-in member through this unguarded field. The admin's
      // contribution thread header reads it and shows the alias now.
      this.publicName = publishNameLogic.getPublicAlias()
      this.userIdentifier = publishNameLogic.getUserIdentifier(publishNameType)

      if (dbUser.emailContact) {
        this.emailChecked = dbUser.emailContact.emailChecked
        this.emailContact = new UserContact(dbUser.emailContact)
      }
      this.firstName = dbUser.firstName
      this.lastName = dbUser.lastName
      this.avatarColorIndex = avatarColorIndex(dbUser.firstName, dbUser.lastName)
      this.salutation = dbUser.salutation
      this.deletedAt = dbUser.deletedAt
      this.createdAt = dbUser.createdAt
      this.language = dbUser.language
      this.publisherId = dbUser.publisherId
      this.roles = dbUser.userRoles?.map((userRole) => userRole.role) ?? []
      this.klickTipp = null
      this.hasElopage = null
      this.hideAmountGDD = dbUser.hideAmountGDD
      this.hideAmountGDT = dbUser.hideAmountGDT
      this.humhubAllowed = dbUser.humhubAllowed
      this.gmsAllowed = dbUser.gmsAllowed
      this.gmsPublishName = dbUser.gmsPublishName
      this.humhubPublishName = dbUser.humhubPublishName
      this.gmsPublishLocation = dbUser.gmsPublishLocation
      this.aboutMe = dbUser.aboutMe
      this.avatarVisibleToMembers = dbUser.avatarVisibleToMembers
      // Lives in its own table, so the user row cannot carry it; verifyLogin fills it.
      // This is the small rendition -- the full one is fetched on demand, see avatarFull.
      this.avatar = null
      // Same: not on the user row. Whoever assembles a list of members fills it in one
      // batch; null until then, and null for good where there is nothing to show.
      this.avatarUpdatedAt = null
      this.userLocation = dbUser.location ? Point2Location(dbUser.location as Point) : null
      // Unrestricted by default; verifyLogin fills in a scoped moderator's real groups.
      this.visibleCreationGroups = []
      this.seesAllCreationGroups = true
      this.seesUntagged = true
    }
  }

  @Field(() => Int)
  id: number

  @Field(() => Boolean)
  foreign: boolean

  @Field(() => String)
  communityUuid: string

  @Field(() => String, { nullable: true })
  communityName: string | null

  @Field(() => String)
  gradidoID: string

  @Field(() => String, { nullable: true })
  alias: string | null

  @Field(() => String, { nullable: true })
  publicName: string | null

  @Field(() => String, { nullable: true })
  userIdentifier: string | null

  @Field(() => String, { nullable: true })
  firstName: string | null

  @Field(() => String, { nullable: true })
  lastName: string | null

  // The colour of this member's avatar circle, as an index into the wallet's ten-entry
  // palette. Computed from the first characters of the real name, so that no existing
  // circle colour moves (AS-010) — and computed HERE so the name itself can stop
  // travelling (NU-017): once firstName and lastName read as null to other members,
  // this digit is all the wallet needs to keep every circle the colour it always was.
  //
  // Nullable for the synthetic users that are assembled field by field instead of from
  // a database row (new User(null), see queryRedeemJwtLink); the wallet falls back to
  // its own seed computation when the index is absent.
  @Field(() => Int, { nullable: true })
  avatarColorIndex: number | null

  // How this participant is addressed in Crea's replies, curated by the moderation
  // (E-013). Null = none set, so the first-name heuristic decides. Kept here rather
  // than a gender field on purpose: what we need is the form of address, not the
  // person's gender.
  //
  // This type is shared with the wallet, so the field is guarded by a FieldResolver in
  // UserResolver: without VIEW_USER_SALUTATION it reads as null. What the moderation
  // noted about a person is not for the person's counterparties.
  @Field(() => String, { nullable: true })
  salutation: string | null

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  @Field(() => Date)
  createdAt: Date

  @Field(() => Boolean)
  emailChecked: boolean

  @Field(() => String)
  language: string

  @Field(() => Boolean)
  hideAmountGDD: boolean

  @Field(() => Boolean)
  hideAmountGDT: boolean

  @Field(() => Boolean)
  humhubAllowed: boolean

  @Field(() => Boolean)
  gmsAllowed: boolean

  // Whether other members may see this member's picture. Own view only, like aboutMe and
  // the avatar below, and guarded the same way: a field resolver hands it to nobody else.
  // What a member decided about their own face is their business, and `user()` gives out
  // any member by alias to anyone logged in.
  //
  // Nullable for that reason alone. The column is NOT NULL, so a member reading their own
  // setting always gets a boolean; null here means "not yours to know", never "undecided".
  //
  // verifyLogin is where the wallet reads it -- not the login mutation, which runs on an
  // inalienable right and therefore has no authenticated caller for the guard to match.
  @Field(() => Boolean, { nullable: true })
  avatarVisibleToMembers: boolean

  @Field(() => PublishNameType, { nullable: true })
  gmsPublishName: PublishNameType | null

  @Field(() => PublishNameType, { nullable: true })
  humhubPublishName: PublishNameType | null

  @Field(() => GmsPublishLocationType, { nullable: true })
  gmsPublishLocation: GmsPublishLocationType | null

  @Field(() => String, { nullable: true })
  aboutMe: string | null

  // The member's own profile picture as base64, without a data URI prefix, or null when
  // they have not set one. It does not come from the user row — it lives in its own
  // table and is filled in by verifyLogin, the way hasElopage and klickTipp are.
  //
  // The SMALL rendition, 128x128. This is the everyday picture and the only one that is
  // ever meant to be seen by anybody but its owner. The full 512x512 crop is not a field
  // on this type at all: it is fetched through the avatarFull query, which takes no
  // argument and so cannot be asked about somebody else.
  //
  // Own view only THROUGH THIS FIELD -- the field resolver in UserResolver returns null to
  // anybody but the owner. A face next to a booking is a disclosure to third parties, and
  // that needs its own decision and its own switch: avatarVisibleToMembers above.
  //
  // ⚠️ That switch is read now, and other members DO see this rendition -- but through the
  // memberAvatars query, which asks the database for the disclosure rule rather than
  // carrying a picture around on a shared type. The guard on this field is what keeps the
  // two apart.
  @Field(() => String, { nullable: true })
  avatar: string | null

  // When this member last changed the picture that OTHER members may see. Not the picture
  // itself -- a date, which is cheap enough to send with every row of a booking list.
  //
  // It is what lets the wallet keep pictures between visits without asking each time
  // whether they are still current: a stored picture counts as fresh while its date
  // matches this one, and a changed date invalidates exactly the one member who changed.
  //
  // null carries one meaning only -- there is nothing to show. No picture, the switch is
  // off, the member is deleted, or they belong to another community. The wallet does not
  // need to tell those apart, and it must not: each of them is somebody else's business.
  //
  // ⛔ Filled in one batch by whoever builds the list, never by a field resolver. A field
  // resolver here would turn one booking list into one database round trip per row.
  @Field(() => Date, { nullable: true })
  avatarUpdatedAt: Date | null

  // This is not the users publisherId, but the one of the users who recommend him
  @Field(() => Int, { nullable: true })
  publisherId: number | null

  @Field(() => KlickTipp, { nullable: true })
  klickTipp: KlickTipp | null

  @Field(() => Boolean, { nullable: true })
  hasElopage: boolean | null

  @Field(() => [String])
  roles: string[]

  // Group functions: the signed-in moderator's visibility scope, so the admin
  // interface can offer only the groups they may actually work in. Derived the same way as
  // on the community info page (describeModeratorCreationGroups); filled in by verifyLogin. The
  // default is unrestricted, which keeps every other User valid and matches an administrator.
  @Field(() => [String])
  visibleCreationGroups: string[]

  @Field(() => Boolean)
  seesAllCreationGroups: boolean

  // Whether the scope covers contributions without a group. "No group" is not a group, so
  // it cannot live in the list above, but the admin needs it to offer a filter that
  // reaches those contributions.
  @Field(() => Boolean)
  seesUntagged: boolean

  @Field(() => UserContact, { nullable: true })
  emailContact: UserContact | null

  @Field(() => Location, { nullable: true })
  userLocation: Location | null
}
