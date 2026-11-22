// AI-GENERATED — not an architecture reference
import { validate } from 'class-validator'
import { HandledGroupsInput } from './HandledGroupsInput'

// The options the schema is built with, so this asks what the server asks: a class without any
// decorator would be refused for every choice, with a bare "Argument Validation Error".
const SCHEMA_VALIDATION = {
  skipMissingProperties: true,
  skipNullProperties: true,
  skipUndefinedProperties: false,
  forbidUnknownValues: true,
  stopAtFirstError: true,
}

// what it refuses: the property, and for a class it does not know its own word ("unknownValue")
const refusedOf = async (sent: object) =>
  (await validate(Object.assign(new HandledGroupsInput(), sent), SCHEMA_VALIDATION)).map(
    ({ property, constraints }) => property ?? Object.keys(constraints ?? {}).join(),
  )

describe('HandledGroupsInput', () => {
  it.each([
    ['ticks', { groupIds: [3, 7], untagged: true, off: false }],
    ['no tick', { groupIds: [], untagged: false, off: false }],
    ['a column that is off', { groupIds: [3], untagged: false, off: true }],
  ])('takes %s', async (_name, sent) => {
    expect(await refusedOf(sent)).toEqual([])
  })

  it('refuses a group that is no number, and a switch that is none', async () => {
    expect(await refusedOf({ groupIds: ['garden'], untagged: false, off: false })).toEqual([
      'groupIds',
    ])
    expect(await refusedOf({ groupIds: [], untagged: 'no', off: 'yes' })).toEqual([
      'untagged',
      'off',
    ])
  })
})
