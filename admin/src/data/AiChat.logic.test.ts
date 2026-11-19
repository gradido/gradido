// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { chatErrorKey, resumed, signatureMissing, withSignature } from './AiChat.logic'
import type { ChatMessage } from './AiChat.schema'

const message = (more: Partial<ChatMessage> = {}): ChatMessage => ({
  content: 'Hi\n[SIGNATUR]',
  role: 'assistant',
  threadId: 't1',
  errorCode: null,
  ...more,
})

describe('chatErrorKey', () => {
  it('words a known code', () => {
    expect(chatErrorKey('output_too_long')).toBe('ai.error-output-too-long')
  })

  it('has a sentence for a code it does not know', () => {
    expect(chatErrorKey('new_code')).toBe('ai.error-unknown')
  })
})

describe('withSignature', () => {
  it('signs every place Crea left for it', () => {
    expect(withSignature(message({ content: '[SIGNATUR] [SIGNATUR]' }), 'P')).toBe('P P')
  })

  it("leaves the moderator's own words as they are", () => {
    expect(withSignature(message({ role: 'user' }), 'P')).toBe('Hi\n[SIGNATUR]')
  })

  it('leaves the place without a signature', () => {
    expect(withSignature(message(), '')).toBe('Hi\n[SIGNATUR]')
  })
})

describe('signatureMissing', () => {
  it('is so where Crea left a place and there is no signature', () => {
    expect(signatureMissing([message()], '')).toBe(true)
  })

  it('is not so with a signature', () => {
    expect(signatureMissing([message()], 'P')).toBe(false)
  })

  it("is not so for a place in the moderator's own words", () => {
    expect(signatureMissing([message({ role: 'user' })], '')).toBe(false)
  })
})

describe('resumed', () => {
  it('takes the conversation of the first message, without the opening word', () => {
    expect(resumed([message({ role: 'user', content: '/start' }), message()])).toEqual({
      threadId: 't1',
      messages: [message()],
    })
  })

  it('keeps the conversation where its last message is an error', () => {
    const failed = message({ threadId: null, errorCode: 'send_failed' })
    expect(resumed([message(), failed]).threadId).toBe('t1')
  })

  it('takes none where the first message is an error', () => {
    expect(resumed([message({ threadId: null, errorCode: 'send_failed' })]).threadId).toBe('')
  })
})
