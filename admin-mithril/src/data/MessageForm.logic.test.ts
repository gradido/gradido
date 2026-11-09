// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { FormTab } from './FormTab.enum'
import {
  boldAround,
  dayAndTime,
  isTime,
  momentOf,
  submission,
  wholeTime,
  withCreaNote,
} from './MessageForm.logic'

describe('boldAround', () => {
  it('wraps the selection and puts the caret behind it, or between the markers', () => {
    expect(boldAround('make this bold', 5, 9)).toEqual({ value: 'make **this** bold', caret: 13 })
    expect(boldAround('ab', 1, 1)).toEqual({ value: 'a****b', caret: 3 })
  })
})

describe("the resubmission's moment", () => {
  it('makes a typed time whole', () => {
    expect(wholeTime('9:5')).toBe('09:05')
    expect(wholeTime('31:75')).toBe('23:59')
    expect(wholeTime('x')).toBe('00:00')
  })

  it('goes from a moment to day and time and back, where the moderator sits', () => {
    const moment = new Date(2026, 11, 1, 15, 30)
    const { day, time } = dayAndTime(moment)
    expect([day, time]).toEqual(['2026-12-01', '15:30'])
    expect(momentOf(day, time)).toEqual(moment)
  })

  it('takes only a whole time of day as one', () => {
    expect(['00:00', '09:05', '23:59'].every(isTime)).toBe(true)
    expect(['9', '9:5', '24:00', '12:60', '', '12:345'].some(isTime)).toBe(false)
  })

  it('takes a ticked box without a day for the first moment', () => {
    expect(momentOf('', '10:00').getTime()).toBe(0)
  })
})

describe('withCreaNote', () => {
  it('adds the note to the text behind a dash, with the alias only', () => {
    expect(withCreaNote(' Garden work ', 'peter', 'checked')).toBe(
      'Garden work – 💬 peter: checked',
    )
    expect(withCreaNote('', null, 'checked')).toBe('💬 checked')
  })
})

describe('submission', () => {
  const form = {
    tab: FormTab.MESSAGE,
    text: '',
    memo: 'memo',
    originalMemo: 'memo',
    contributionId: 7,
    resubmissionAt: 'then',
    aiModel: null,
  }

  it('sends only the resubmission where nothing else changed', () => {
    expect(submission({ ...form, tab: FormTab.MEMO })).toMatchObject({
      kind: 'resubmission',
      variables: { id: 7, resubmissionAt: 'then' },
    })
  })

  it('sends a message or a note with its words, and the model of a draft in them', () => {
    expect(submission({ ...form, text: 'hi', aiModel: 'claude-x' }).variables).toEqual({
      contributionId: 7,
      message: 'hi',
      messageType: 'DIALOG',
      resubmissionAt: 'then',
      aiModel: 'claude-x',
    })
    expect(submission({ ...form, tab: FormTab.NOTE, text: 'hi' }).variables).toEqual({
      contributionId: 7,
      message: 'hi',
      messageType: 'MODERATOR',
      resubmissionAt: 'then',
    })
  })

  it('sends the changed text, also from the message tab with an empty field', () => {
    for (const tab of [FormTab.MEMO, FormTab.MESSAGE]) {
      expect(submission({ ...form, tab, memo: 'new memo' })).toMatchObject({
        kind: 'memo',
        variables: { id: 7, memo: 'new memo', resubmissionAt: 'then' },
      })
    }
    expect(submission({ ...form, tab: FormTab.MEMO, text: 'unsent', memo: 'new' }).kind).toBe(
      'memo',
    )
  })
})
