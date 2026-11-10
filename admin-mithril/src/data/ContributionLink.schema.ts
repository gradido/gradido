// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** A contribution link as listContributionLinks answers it. */
export const contributionLinkSchema = v.object({
  id: v.number(),
  amount: v.string(),
  name: v.string(),
  memo: v.string(),
  code: v.string(),
  link: v.string(),
  createdAt: v.string(),
  validFrom: v.nullable(v.string()),
  validTo: v.nullable(v.string()),
  maxAmountPerMonth: v.nullable(v.string()),
  cycle: v.string(),
  maxPerCycle: v.number(),
})

export type ContributionLink = v.InferOutput<typeof contributionLinkSchema>

export const contributionLinkListSchema = v.object({
  listContributionLinks: v.object({
    links: v.array(contributionLinkSchema),
    count: v.number(),
  }),
})

/**
 * What the form holds: what the moderator types, the days as the date inputs take them
 * (`YYYY-MM-DD`). Empty fields are null, as the old admin sent them.
 */
export type ContributionLinkForm = {
  name: string | null
  memo: string | null
  amount: string | null
  validFrom: string | null
  validTo: string | null
  cycle: string
  maxPerCycle?: number
}

/** The form of a new link. The server needs a cycle, so it is set. */
export const newContributionLinkForm = (): ContributionLinkForm => ({
  name: null,
  memo: null,
  amount: null,
  validFrom: null,
  validTo: null,
  cycle: 'ONCE',
})

// the day of an instant the server sends, as the date input takes it
const day = (instant: string | null) => instant?.split('T')[0] ?? null

/** The form of `link`, to edit it. */
export const contributionLinkFormOf = (link: ContributionLink): ContributionLinkForm => ({
  name: link.name,
  memo: link.memo,
  amount: link.amount,
  validFrom: day(link.validFrom),
  validTo: day(link.validTo),
  cycle: link.cycle,
  maxPerCycle: link.maxPerCycle,
})
