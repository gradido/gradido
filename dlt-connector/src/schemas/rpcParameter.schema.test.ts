import { communitySchema } from './rpcParameter.schema'
import { uuidv4Schema } from './typeGuard.schema'
import * as v from 'valibot'
// only for IDE, bun don't need this to work
import { describe, expect, it } from 'bun:test'

describe('rpcParameter.schema', () => {
  it('community', () => {
    expect(v.parse(communitySchema, {
      uuid: '4f28e081-5c39-4dde-b6a4-3bde71de8d65',
      foreign: false,
      createdAt: '2021-01-01',
    })).toEqual(
      {
        uuid: v.parse(uuidv4Schema, '4f28e081-5c39-4dde-b6a4-3bde71de8d65'),
        foreign: false,
        createdAt: new Date('2021-01-01'),
      },
    )
  })
})
