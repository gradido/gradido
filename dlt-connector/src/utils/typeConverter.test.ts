import 'reflect-metadata'

import { base64ToBuffer, iotaTopicFromCommunityUUID, uuid4ToBuffer } from './typeConverter'

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

  it('base64ToBuffer', () => {
    expect(base64ToBuffer('MTizWQMR/fCoI+FzyqlIe30nXCP6sHEGtLE2TLA4r/0=')).toStrictEqual(
      Buffer.from('3138b3590311fdf0a823e173caa9487b7d275c23fab07106b4b1364cb038affd', 'hex'),
    )
  })
})
