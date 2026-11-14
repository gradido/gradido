// AI-GENERATED — not an architecture reference
import * as v from 'valibot'
import { creationGroupNameSchema } from './CreationGroup.schema'

/** The member of a contribution, as its row, its face and its opened card read them. */
export const contributorSchema = v.object({
  firstName: v.string(),
  lastName: v.string(),
  alias: v.nullable(v.string()),
  // how Crea greets them, where a moderator stored it
  salutation: v.nullable(v.string()),
  gradidoID: v.string(),
  communityUuid: v.string(),
  avatarUpdatedAt: v.nullable(v.string()),
  emailContact: v.nullable(v.object({ email: v.string() })),
  // the opened contribution's member line: their public name, the pin, the arrow, the profile
  publicName: v.nullable(v.string()),
  userIdentifier: v.nullable(v.string()),
  createdAt: v.string(),
  findableOnMap: v.nullable(v.boolean()),
  deletedAt: v.nullable(v.string()),
})

/** A contribution as the moderation lists it (adminListContributions). */
export const listedContributionSchema = v.object({
  id: v.number(),
  userId: v.nullable(v.number()),
  user: v.nullable(contributorSchema),
  // GradidoUnit: a decimal as a string
  amount: v.string(),
  memo: v.string(),
  creationGroups: v.array(creationGroupNameSchema),
  contributionDate: v.string(),
  createdAt: v.string(),
  closedAt: v.nullable(v.string()),
  closedBy: v.nullable(v.number()),
  closedByUserName: v.nullable(v.string()),
  updatedBy: v.nullable(v.number()),
  updatedByUserName: v.nullable(v.string()),
  moderatorId: v.nullable(v.number()),
  moderatorUserName: v.nullable(v.string()),
  contributionStatus: v.string(),
  messagesCount: v.number(),
  // the newest message of the conversation with the member, the moderators' notes left out
  lastMessageType: v.nullable(v.string()),
  lastMessageByModerator: v.nullable(v.boolean()),
  // whether a colleague's note is the newest word on the open question
  colleagueNoteOnQuestion: v.nullable(v.boolean()),
  resubmissionAt: v.nullable(v.string()),
})

export type ListedContribution = v.InferOutput<typeof listedContributionSchema>

export const contributionListSchema = v.object({
  adminListContributions: v.object({
    contributionCount: v.number(),
    contributionList: v.array(listedContributionSchema),
  }),
})

export const contributionCountSchema = v.object({
  adminListContributions: v.object({ contributionCount: v.number() }),
})

/** A message of a contribution's thread: to or from the member, a note, or a change's record. */
export const threadMessageSchema = v.object({
  id: v.number(),
  message: v.string(),
  createdAt: v.string(),
  type: v.string(),
  userAlias: v.nullable(v.string()),
  // null where the writer is gone
  userId: v.nullable(v.number()),
  userAvatarColorIndex: v.nullable(v.number()),
  userGradidoID: v.nullable(v.string()),
  userCommunityUuid: v.nullable(v.string()),
  userAvatarUpdatedAt: v.nullable(v.string()),
  isModerator: v.boolean(),
})

export type ThreadMessage = v.InferOutput<typeof threadMessageSchema>

/** The moderation's remark on a member. */
export const userRemarkSchema = v.object({
  remark: v.string(),
  updatedAt: v.string(),
  updatedByName: v.nullable(v.string()),
})

export type UserRemark = v.InferOutput<typeof userRemarkSchema>

/** The answer to an opened contribution: its thread, and the remark on its member. */
export const threadSchema = v.object({
  userRemark: v.nullable(userRemarkSchema),
  adminListContributionMessages: v.object({
    count: v.number(),
    messages: v.array(threadMessageSchema),
  }),
})
