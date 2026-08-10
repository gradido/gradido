// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach } from 'vitest'
import { useEntryDraft, clearEntryDraft } from './useEntryDraft'

describe('useEntryDraft', () => {
  beforeEach(() => {
    // The draft lives at module level, so one test must not hand anything to the
    // next. Taking it is what clears it.
    useEntryDraft().take()
  })

  it('holds nothing until something is put in', () => {
    expect(useEntryDraft().take()).toBeNull()
  })

  it('carries a typed search over to the form', () => {
    useEntryDraft().put({ summary: 'Fahrrad', matchingType: 'gesuch' })

    expect(useEntryDraft().take()).toEqual({ summary: 'Fahrrad', matchingType: 'gesuch' })
  })

  it('is one-shot: the same offer cannot be taken up twice', () => {
    // Otherwise coming back to the entries tab days later would open the form again
    // over an offer the member already walked away from.
    const draft = useEntryDraft()
    draft.put({ summary: 'Fahrrad', matchingType: 'gesuch' })

    expect(draft.take()).not.toBeNull()
    expect(draft.take()).toBeNull()
  })

  it('is the same handover for both sides, not one each', () => {
    // The map puts and the form takes - two callers, one draft. If each call built
    // its own, nothing would ever arrive.
    useEntryDraft().put({ summary: 'Klavierlehrer', matchingType: 'gesuch' })

    expect(useEntryDraft().take()?.summary).toBe('Klavierlehrer')
  })

  it('keeps only the newest offer when one is put over another', () => {
    const draft = useEntryDraft()
    draft.put({ summary: 'Fahrrad', matchingType: 'gesuch' })
    draft.put({ summary: 'Lastenrad', matchingType: 'angebot' })

    expect(draft.take()).toEqual({ summary: 'Lastenrad', matchingType: 'angebot' })
  })

  // Logging out clears the store and the persisted blob but does not reload the
  // page, so this module lives on. Without clearing, a sentence typed by one
  // member could open in the entry form of the next one to sign in on the same
  // browser - and the words here can be as private as words get.
  it('is emptied when a session ends', () => {
    useEntryDraft().put({ summary: 'Hilfe bei Depression', matchingType: 'gesuch' })

    clearEntryDraft()

    expect(useEntryDraft().take()).toBeNull()
  })
})
