import 'reflect-metadata'

import { Timestamp } from '@/data/proto/3_3/Timestamp'

import {
  base64ToBuffer,
  iotaTopicFromCommunityUUID,
  timestampSecondsToDate,
  timestampToDate,
  uuid4ToBuffer,
} from './typeConverter'

describe('utils/typeConverter', () => {
  it('uuid4ToBuffer', () => {
    expect(uuid4ToBuffer('4f28e081-5c39-4dde-b6a4-3bde71de8d65')).toStrictEqual(
      Buffer.from('4f28e0815c394ddeb6a43bde71de8d65', 'hex'),
    )
  })

  it('iotaTopicFromCommunityUUID', () => {
    expect(iotaTopicFromCommunityUUID('4f28e081-5c39-4dde-b6a4-3bde71de8d65')).toBe(
      '3138b3590311fdf0a823e173caa9487b7d275c23fab07106b4b1364cb038affd',
    )
  })

  it('timestampToDate', () => {
    const now = new Date('Thu, 05 Oct 2023 11:55:18.102 +0000')
    const timestamp = new Timestamp(now)
    expect(timestamp.seconds).toBe(Math.round(now.getTime() / 1000))
    expect(timestampToDate(timestamp)).toEqual(now)
  })

  it('timestampSecondsToDate', () => {
    const now = new Date('Thu, 05 Oct 2023 11:55:18.102 +0000')
    const timestamp = new Timestamp(now)
    expect(timestamp.seconds).toBe(Math.round(now.getTime() / 1000))
    expect(timestampSecondsToDate(timestamp)).toEqual(new Date('Thu, 05 Oct 2023 11:55:18 +0000'))
  })

  it('base64ToBuffer', () => {
    expect(base64ToBuffer('MTizWQMR/fCoI+FzyqlIe30nXCP6sHEGtLE2TLA4r/0=')).toStrictEqual(
      Buffer.from('3138b3590311fdf0a823e173caa9487b7d275c23fab07106b4b1364cb038affd', 'hex'),
    )
  })
})
