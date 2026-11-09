// AI-GENERATED — not an architecture reference
import { tenureBucket } from '@admin/utils/tenure'
import type { ListedContribution } from './Contribution.schema'

const SALUTATION = '[ANREDE]'
const SIGNATURE = '[SIGNATUR]'

/** Crea's reply with both placeholders filled in, where there is something to fill them with. */
export const renderDraft = (text: string, salutation: string, signature: string) => {
  const greeted = salutation ? text.split(SALUTATION).join(salutation) : text
  return signature ? greeted.split(SIGNATURE).join(signature) : greeted
}

/** The hours (1 h = 20 GDD), the amount and the day of a contribution, as one line. */
export const contributionMeta = (
  { amount, contributionDate }: Pick<ListedContribution, 'amount' | 'contributionDate'>,
  locale: string,
  hoursUnit: string,
) => {
  const gdd = Number(amount)
  const hours = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(gdd / 20)
  return [
    `${hours} ${hoursUnit}`,
    `${new Intl.NumberFormat(locale).format(gdd)} GDD`,
    new Intl.DateTimeFormat(locale).format(new Date(contributionDate)),
  ].join(' · ')
}

/** The key and count of "member for how long", or null without a readable date. */
export const tenureKey = (created: string, now = new Date()) => {
  const bucket = tenureBucket(created, now)
  if (!bucket) {
    return null
  }
  const { unit, count } = bucket
  if (unit === 'today') {
    return { key: 'crea.tenure.today', count }
  }
  const singular = { days: 'day', weeks: 'week', months: 'month', years: 'year' }[unit]
  return { key: `crea.tenure.${count === 1 ? singular : unit}`, count }
}

export type Section = { key: 'open' | 'due' | 'later'; items: ListedContribution[] }

/**
 * The member's open contributions by resubmission, in the order the moderator works them: never
 * put off, put off and due, put off until later -- as the list behind the window hides them.
 * Empty groups drop out.
 */
export const sectionsByResubmission = (contributions: ListedContribution[], now: Date) => {
  const sections: Section[] = [
    { key: 'open', items: [] },
    { key: 'due', items: [] },
    { key: 'later', items: [] },
  ]
  for (const contribution of contributions) {
    const at = contribution.resubmissionAt
    // an unreadable date still says it was put off once
    const index = at === null ? 0 : new Date(at) > now ? 2 : 1
    sections[index].items.push(contribution)
  }
  return sections.filter((section) => section.items.length > 0)
}

/**
 * The flags the moderator is shown: not the preview's marker, which has a banner of its own, and
 * not the uncertain salutation once one is stored.
 */
export const shownFlags = (flags: string[] | null, salutationSettled: boolean) =>
  (flags ?? []).filter(
    (flag) => flag !== 'stub_preview' && !(flag === 'anrede_unsicher' && salutationSettled),
  )

/** What Crea is given of a contribution: no name -- the first name only fills [ANREDE] here. */
export const evaluationInput = (
  contribution: ListedContribution,
  salutation: string | null,
  readsRemark: boolean,
  uiLanguage: string,
) => ({
  text: contribution.memo,
  enteredGdd: Number(contribution.amount),
  // with a reference the server keeps the record
  contributionRef: String(contribution.id),
  recipientFirstName: contribution.user?.firstName ?? null,
  salutation,
  // pseudonymous: the id, never a name
  personPseudonym: contribution.userId === null ? null : String(contribution.userId),
  // the member whose remark Crea may read -- only where the moderator lets her
  userId: readsRemark ? contribution.userId : null,
  date: contribution.contributionDate,
  uiLanguage,
})

/** What Crea is given of several contributions of one member, to judge together. */
export const batchInput = (
  contributions: ListedContribution[],
  member: ListedContribution,
  salutation: string | null,
  readsRemark: boolean,
  uiLanguage: string,
) => ({
  contributions: contributions.map(({ memo, amount, contributionDate }) => ({
    text: memo,
    enteredGdd: Number(amount),
    date: contributionDate,
  })),
  recipientFirstName: member.user?.firstName ?? null,
  salutation,
  uiLanguage,
  userId: readsRemark ? member.userId : null,
})
