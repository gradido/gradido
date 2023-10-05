import 'reflect-metadata'
import { Timestamp } from '@/proto/3_3/Timestamp'
import { timestampToDate } from './typeConverter'

describe('utils/typeConverter', () => {
  it('timestampToDate', () => {
    const now = new Date('Thu, 05 Oct 2023 11:55:18 +0000')
    const timestamp = new Timestamp(now)
    expect(timestamp.seconds).toBe(Math.round(now.getTime() / 1000))
    expect(timestampToDate(timestamp)).toEqual(now)
  })
})
