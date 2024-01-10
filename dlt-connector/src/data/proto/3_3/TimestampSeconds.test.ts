import { TimestampSeconds } from './TimestampSeconds'

describe('test TimestampSeconds constructor', () => {
  it('with date input object', () => {
    const now = new Date('2011-04-17T12:01:10.109')
    const timestamp = new TimestampSeconds(now)
    expect(timestamp.seconds).toEqual(1303041670)
  })

  it('with milliseconds number input', () => {
    const timestamp = new TimestampSeconds(1303041670109)
    expect(timestamp.seconds).toEqual(1303041670)
  })
})
