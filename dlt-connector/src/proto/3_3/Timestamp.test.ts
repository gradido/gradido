import { Timestamp } from './Timestamp'

describe('test timestamp constructor', () => {
  it('with date input object', () => {
    const now = new Date('2011-04-17T12:01:10.109')
    const timestamp = new Timestamp(now)
    expect(timestamp.seconds).toEqual(1303041670)
    expect(timestamp.nanoSeconds).toEqual(109000000)
  })

  it('with milliseconds number input', () => {
    const timestamp = new Timestamp(1303041670109)
    expect(timestamp.seconds).toEqual(1303041670)
    expect(timestamp.nanoSeconds).toEqual(109000000)
  })
})
