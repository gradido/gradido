// AI-GENERATED — not an architecture reference
import { moderator } from './signIn'

/** The member of a listed contribution, as adminListContributions names them. */
export const contributor = (id: number, more: Record<string, unknown> = {}) => ({
  __typename: 'User',
  id,
  firstName: `First${id}`,
  lastName: `Last${id}`,
  alias: `member${id}`,
  salutation: null,
  gradidoID: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
  communityUuid: moderator.communityUuid,
  avatarUpdatedAt: null,
  findableOnMap: false,
  deletedAt: null,
  emailContact: { email: `member${id}@example.org` },
  publicName: `member${id}`,
  userIdentifier: `member${id}`,
  createdAt: '2026-01-15T10:00:00.000Z',
  ...more,
})

/** A contribution as adminListContributions lists it: open, from member `userId`. */
export const listedContribution = (
  id: number,
  userId = id,
  more: Record<string, unknown> = {},
) => ({
  id,
  user: contributor(userId),
  // GradidoUnit: the server sends amounts as strings
  amount: '100',
  memo: `Memo of contribution ${id}`,
  creationGroups: [],
  closedAt: null,
  closedBy: null,
  closedByUserName: null,
  contributionDate: '2026-10-01T00:00:00.000Z',
  createdAt: '2026-10-05T09:00:00.000Z',
  updatedAt: null,
  updatedBy: null,
  updatedByUserName: null,
  contributionStatus: 'PENDING',
  messagesCount: 0,
  lastMessageType: null,
  lastMessageByModerator: null,
  colleagueNoteOnQuestion: null,
  moderatorId: null,
  moderatorUserName: null,
  userId,
  resubmissionAt: null,
  ...more,
})

export const contributionList = (
  contributionList: ReturnType<typeof listedContribution>[],
  contributionCount = contributionList.length,
) => ({ contributionCount, contributionList })

export const groups = [
  { id: 1, tag: 'garten', name: 'Garten', hashtagsAdoptedAt: null, hashtagsAdoptedCount: 0 },
  { id: 2, tag: 'kueche', name: null, hashtagsAdoptedAt: null, hashtagsAdoptedCount: 0 },
]

/** A message of a contribution's thread, as adminListContributionMessages lists it. */
export const threadMessage = (id: number, more: Record<string, unknown> = {}) => ({
  id,
  message: `Message ${id}`,
  createdAt: '2026-10-06T09:00:00.000Z',
  updatedAt: null,
  type: 'DIALOG',
  userAlias: 'member1',
  userId: 1,
  userAvatarColorIndex: null,
  userGradidoID: contributor(1).gradidoID,
  userCommunityUuid: moderator.communityUuid,
  userAvatarUpdatedAt: null,
  isModerator: false,
  ...more,
})

/** A moderator's message in a thread: the moderator signed in, where nobody else is named. */
export const moderatorMessage = (id: number, more: Record<string, unknown> = {}) =>
  threadMessage(id, {
    userAlias: moderator.alias,
    userId: 99,
    userGradidoID: moderator.gradidoID,
    isModerator: true,
    ...more,
  })

/** The answer to the question of an opened row: the thread, and the remark on the member. */
export const threadAnswers = (
  messages: ReturnType<typeof threadMessage>[],
  remark: { remark: string; updatedAt: string; updatedByName: string | null } | null = null,
) => ({
  adminListContributionMessages: { count: messages.length, messages },
  userRemark: remark,
})

/** Crea's evaluation of a contribution, as creaEvaluateContribution answers it. */
export const creaEvaluation = (more: Record<string, unknown> = {}) => ({
  beitragRef: '1',
  overallVerdict: 'confirm',
  discrepancy: null,
  appliedRule: null,
  confidence: 0.9,
  reasoning: 'Plausible hours for garden work.',
  responseText: '[ANREDE],\n\nthank you for your work.\n\n[SIGNATUR]',
  defaultSalutation: 'Hallo First1',
  activities: [],
  openPoints: [{ question: 'How many beds?', options: ['one', 'two'], relatesTo: null }],
  flags: ['anrede_unsicher'],
  model: 'claude-x',
  ...more,
})
