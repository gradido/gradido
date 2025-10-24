// only for IDE, bun don't need this to work
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { hieroIdSchema, uuidv4Schema } from '../../schemas/typeGuard.schema'
import { communitySchema } from './output.schema'

describe('community.schema', () => {
  it('community', () => {
    expect(
      v.parse(communitySchema, {
        uuid: '4f28e081-5c39-4dde-b6a4-3bde71de8d65',
        hieroTopicId: '0.0.4',
        foreign: false,
        name: 'Test',
        creationDate: '2021-01-01',
      }),
    ).toEqual({
      hieroTopicId: v.parse(hieroIdSchema, '0.0.4'),
      uuid: v.parse(uuidv4Schema, '4f28e081-5c39-4dde-b6a4-3bde71de8d65'),
      foreign: false,
      name: 'Test',
      creationDate: new Date('2021-01-01'),
    })
  })
})
