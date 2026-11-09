// AI-GENERATED — not an architecture reference
import { adminCreateContributionMessage } from '@admin/graphql/adminCreateContributionMessage'
import { adminUpdateContribution } from '@admin/graphql/adminUpdateContribution'
import type { DocumentNode } from 'graphql'
import { FormTab } from './FormTab.enum'

/** The contribution text's limit on the server (migration 0093): the save is blocked past it. */
export const MEMO_MAX_LENGTH = 512

/** `value` with **…** around the selection `start`-`end`, and the caret after it -- or between. */
export const boldAround = (value: string, start: number, end: number) => {
  const selected = value.slice(start, end)
  return {
    value: `${value.slice(0, start)}**${selected}**${value.slice(end)}`,
    caret: selected ? end + 4 : start + 2,
  }
}

/** A time as typed, made whole: hh:mm, each part within its bounds, anything unreadable 0. */
export const wholeTime = (typed: string) => {
  const [hours, minutes] = typed.split(':')
  const part = (text: string | undefined, max: number) =>
    String(Math.min(Number.parseInt(text ?? '') || 0, max)).padStart(2, '0')
  return `${part(hours, 23)}:${part(minutes, 59)}`
}

/** A moment as the day of a date field (YYYY-MM-DD) and the time of the time field, where it is. */
export const dayAndTime = (date: Date) => ({
  day: [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-'),
  time: date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
})

/** Whether `typed` is a time of day as hh:mm: nothing is assumed of one that is not. */
export const isTime = (typed: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(typed)

/**
 * The moment of a day and a time (hh:mm, see isTime) where the moderator sits; without a day the
 * very first one.
 */
export const momentOf = (day: string, time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  if (!day) {
    // as the old admin: a box ticked without a day is a resubmission in the past
    return new Date(0)
  }
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date, hours, minutes)
}

/**
 * The marker a note of Crea goes into the contribution text with: the moderator's alias and
 * nothing else -- the text goes into the booking and stands in account statements for good.
 */
export const withCreaNote = (memo: string, alias: string | null, note: string) => {
  const marker = alias ? `💬 ${alias}: ${note}` : `💬 ${note}`
  const current = memo.trim()
  return current ? `${current} – ${marker}` : marker
}

type Form = {
  tab: FormTab
  text: string
  memo: string
  originalMemo: string
  contributionId: number
  // Date.prototype.toString of the resubmission, as the server reads it; null for none
  resubmissionAt: string | null
  // the model whose draft is in the text
  aiModel: string | null
}

/**
 * What a save sends. Only the resubmission where nothing else changed; the message or note where
 * its tab has words; the contribution text otherwise -- also from the message's tab with an empty
 * field, where the text was changed.
 */
export const submission = (
  form: Form,
): {
  kind: 'resubmission' | 'message' | 'memo'
  mutation: DocumentNode
  variables: Record<string, unknown>
} => {
  const { tab, text, memo, contributionId: id, resubmissionAt } = form
  if (text === '' && memo === form.originalMemo) {
    return {
      kind: 'resubmission',
      mutation: adminUpdateContribution,
      variables: { id, resubmissionAt },
    }
  }
  if (tab !== FormTab.MEMO && text !== '') {
    return {
      kind: 'message',
      mutation: adminCreateContributionMessage,
      variables: {
        contributionId: id,
        message: text,
        messageType: tab === FormTab.MESSAGE ? 'DIALOG' : 'MODERATOR',
        resubmissionAt,
        ...(form.aiModel ? { aiModel: form.aiModel } : {}),
      },
    }
  }
  return {
    kind: 'memo',
    mutation: adminUpdateContribution,
    variables: { id, memo, resubmissionAt },
  }
}
