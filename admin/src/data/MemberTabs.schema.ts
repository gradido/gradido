// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** What the support needs to know of a member's addresses (adminEmailStatus). */
export const emailStatusSchema = v.object({
  adminEmailStatus: v.nullable(
    v.object({
      gdtEmail: v.nullable(v.string()),
      currentConfirmed: v.boolean(),
      elopageBuysOnCurrent: v.boolean(),
      pendingEmail: v.nullable(v.string()),
      pendingSince: v.nullable(v.string()),
    }),
  ),
})

export type EmailStatus = NonNullable<v.InferOutput<typeof emailStatusSchema>['adminEmailStatus']>

/** A page of a member's contributions (adminListContributionsShort). */
export const memberContributionsSchema = v.object({
  adminListContributions: v.object({
    contributionCount: v.number(),
    contributionList: v.array(
      v.object({
        id: v.number(),
        amount: v.string(),
        memo: v.string(),
        createdAt: v.string(),
        contributionDate: v.string(),
        confirmedAt: v.nullable(v.string()),
        contributionStatus: v.string(),
      }),
    ),
  }),
})

export type MemberContribution = v.InferOutput<
  typeof memberContributionsSchema
>['adminListContributions']['contributionList'][number]

/** A page of the transaction links a member made (listTransactionLinksAdmin). */
export const memberTransactionLinksSchema = v.object({
  listTransactionLinksAdmin: v.object({
    count: v.number(),
    links: v.array(
      v.object({
        id: v.number(),
        amount: v.string(),
        memo: v.string(),
        createdAt: v.string(),
        validUntil: v.string(),
        redeemedAt: v.nullable(v.string()),
        deletedAt: v.nullable(v.string()),
      }),
    ),
  }),
})

export type MemberTransactionLink = v.InferOutput<
  typeof memberTransactionLinksSchema
>['listTransactionLinksAdmin']['links'][number]
