// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { commandArgsForLog } from './commandArgsForLog'

const PICTURE = Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  Buffer.from('a private picture of Anna and Ben'),
  Buffer.from([0xff, 0xd9]),
]).toString('base64')

describe('commandArgsForLog', () => {
  it('writes the picture of a chat message as its length, and the rest of the argument as it came', () => {
    const arg = JSON.stringify({
      mailType: 'sendCustomEmail',
      memo: 'Look at this',
      images: [{ imageUuid: 'abc', width: 924, height: 520, data: PICTURE }],
      messageUuid: 'def',
    })

    const [written] = commandArgsForLog([arg]) as string[]

    expect(written).not.toContain(PICTURE)
    expect(JSON.parse(written)).toEqual({
      mailType: 'sendCustomEmail',
      memo: 'Look at this',
      images: [
        { imageUuid: 'abc', width: 924, height: 520, data: `*** ${PICTURE.length} characters` },
      ],
      messageUuid: 'def',
    })
  })

  // The text of a message is written as before the pictures (P7b leaves it as it is).
  it('leaves an argument without a picture as it came, byte for byte', () => {
    const arg = JSON.stringify({ mailType: 'sendCustomEmail', memo: 'Grüße, "quoted" \\ text 😀' })

    expect(commandArgsForLog([arg])).toEqual([arg])
  })

  it('leaves what is no JSON, what is no list, and what is no picture as it came', () => {
    expect(commandArgsForLog(['not json', 42])).toEqual(['not json', 42])
    expect(commandArgsForLog('not a list')).toBe('not a list')
    const odd = JSON.stringify({ images: [{ data: 42 }, 'x'] })
    expect(commandArgsForLog([odd])).toEqual([odd])
  })
})
