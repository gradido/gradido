// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import {
  endEventLinkInvitation,
  eventLinkAnswerUnderway,
  eventLinkInvitationOver,
  eventLinkSentence,
  eventLinkUnderway,
  forgetEventLinkArrival,
} from './useEventMatchingArrival'

/**
 * Who got the entry of an event link in this session (KA-015). The entries page reports it,
 * the invitation onto the map reads it -- EventMatchingHomeInvitation.spec.js and
 * Matching.spec.js hold the two ends.
 */
describe('useEventMatchingArrival', () => {
  const maren = ref('marens-gradido-id')

  beforeEach(() => {
    forgetEventLinkArrival()
    maren.value = 'marens-gradido-id'
  })

  it('knows nothing before a link was opened', () => {
    expect(eventLinkSentence(maren).value).toBeNull()
    expect(eventLinkAnswerUnderway.value).toBe(false)
  })

  it('is underway from the request until its answer', () => {
    const answered = eventLinkUnderway('marens-gradido-id')
    expect(eventLinkAnswerUnderway.value).toBe(true)

    answered('Kongress Frequency Healing')

    expect(eventLinkAnswerUnderway.value).toBe(false)
  })

  it('holds the sentence of an entry the link made, for the member who opened it', () => {
    eventLinkUnderway('marens-gradido-id')('Kongress Frequency Healing')

    expect(eventLinkSentence(maren).value).toBe('Kongress Frequency Healing')
    expect(eventLinkSentence(ref('somebody-else')).value).toBeNull()
    expect(eventLinkSentence(ref(null)).value).toBeNull()
  })

  // There already, refused, no connection: no entry made, nobody to invite.
  it('holds nothing where the link made no entry', () => {
    eventLinkUnderway('marens-gradido-id')(null)

    expect(eventLinkSentence(maren).value).toBeNull()
    expect(eventLinkAnswerUnderway.value).toBe(false)
  })

  it('stays underway while one of two answers is still out', () => {
    const first = eventLinkUnderway('marens-gradido-id')
    const second = eventLinkUnderway('marens-gradido-id')

    first(null)
    expect(eventLinkAnswerUnderway.value).toBe(true)
    second(null)
    expect(eventLinkAnswerUnderway.value).toBe(false)
  })

  it('counts an answer once, however often it is given', () => {
    const first = eventLinkUnderway('marens-gradido-id')
    eventLinkUnderway('marens-gradido-id')

    first(null)
    first(null)

    expect(eventLinkAnswerUnderway.value).toBe(true)
  })

  /**
   * Over until the next start -- answered, or no longer needed -- and kept here rather than in
   * the window, which is mounted anew with its layout.
   */
  describe('the end of the invitation', () => {
    it('is not there before it is said', () => {
      expect(eventLinkInvitationOver(maren).value).toBe(false)
    })

    it('holds for the member it was said for, and nobody else', () => {
      endEventLinkInvitation('marens-gradido-id')

      expect(eventLinkInvitationOver(maren).value).toBe(true)
      expect(eventLinkInvitationOver(ref('somebody-else')).value).toBe(false)
      expect(eventLinkInvitationOver(ref(null)).value).toBe(false)
    })

    it('leaves the sentence where it is, for the window that is closing', () => {
      eventLinkUnderway('marens-gradido-id')('Kongress Frequency Healing')

      endEventLinkInvitation('marens-gradido-id')

      expect(eventLinkSentence(maren).value).toBe('Kongress Frequency Healing')
    })
  })

  it('forgets the sentence, every answer underway and the end of the invitation', () => {
    eventLinkUnderway('marens-gradido-id')('Kongress Frequency Healing')
    eventLinkUnderway('marens-gradido-id')
    endEventLinkInvitation('marens-gradido-id')

    forgetEventLinkArrival()

    expect(eventLinkSentence(maren).value).toBeNull()
    expect(eventLinkAnswerUnderway.value).toBe(false)
    expect(eventLinkInvitationOver(maren).value).toBe(false)
  })

  // ⛔ The answer of a request sent before a sign-out arrives after it: it is nobody's.
  it('drops an answer that comes after the logout', () => {
    const answered = eventLinkUnderway('marens-gradido-id')
    forgetEventLinkArrival()

    answered('Kongress Frequency Healing')

    expect(eventLinkSentence(maren).value).toBeNull()
    expect(eventLinkAnswerUnderway.value).toBe(false)
  })

  it('drops it also where the next member has a request of their own underway', () => {
    const marens = eventLinkUnderway('marens-gradido-id')
    forgetEventLinkArrival()
    const jonas = ref('jonas-gradido-id')
    eventLinkUnderway('jonas-gradido-id')

    marens('Kongress Frequency Healing')

    expect(eventLinkSentence(jonas).value).toBeNull()
    expect(eventLinkSentence(maren).value).toBeNull()
    expect(eventLinkAnswerUnderway.value).toBe(true)
  })
})
