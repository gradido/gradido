// AI-GENERATED — not an architecture reference
import { ValidationError, validate } from 'class-validator'
import { EventMatchingEntryInput } from '@/graphql/input/EventMatchingEntryInput'
import { CreateUserArgs } from './CreateUserArgs'

/**
 * The entry an event link sends along with a registration (Event-Matching), on the args class
 * that carries it, with the options type-graphql validates with (graphql/schema.ts).
 *
 * ⛔ What is held here is that the entry gets through at all. `forbidUnknownValues` refuses a
 * nested input whose class carries no check, whole and with a bare "Argument Validation
 * Error" -- every registration through an event link would fail, and no test of the schema
 * or of the role would see it, because both begin after this step.
 *
 * What an entry may hold -- its lengths, a sentence that is not blank -- is the schema's to
 * say (createUser.schema), and is not asked here.
 */
const SCHEMA_VALIDATE_OPTIONS = {
  validationError: { target: false },
  skipMissingProperties: true,
  skipNullProperties: true,
  skipUndefinedProperties: false,
  forbidUnknownValues: true,
  stopAtFirstError: true,
}

const entryOf = (fields: Record<string, unknown>): EventMatchingEntryInput =>
  Object.assign(new EventMatchingEntryInput(), fields)

const registration = (more: Record<string, unknown> = {}): CreateUserArgs =>
  Object.assign(new CreateUserArgs(), {
    email: 'maren@example.org',
    firstName: 'Maren',
    lastName: 'Sommer',
    language: 'de',
    ...more,
  })

/** The names of the checks that refused, the nested ones included. */
const refusedBy = (errors: ValidationError[]): string[] =>
  errors.flatMap((error) => [
    ...Object.keys(error.constraints ?? {}),
    ...refusedBy(error.children ?? []),
  ])

const checksFailing = async (args: CreateUserArgs): Promise<string[]> =>
  refusedBy(await validate(args, SCHEMA_VALIDATE_OPTIONS))

describe('CreateUserArgs with the entry of an event link', () => {
  it('takes a registration without one, as before', async () => {
    expect(await checksFailing(registration())).toEqual([])
    expect(await checksFailing(registration({ eventMatchingEntry: null }))).toEqual([])
    expect(await checksFailing(registration({ eventMatchingEntry: undefined }))).toEqual([])
  })

  it('takes an entry with a sentence, details and the reach', async () => {
    const eventMatchingEntry = entryOf({
      summary: 'Kongress Frequency Healing',
      details: 'Selbstheilung, Biohacking',
      remote: true,
    })

    expect(await checksFailing(registration({ eventMatchingEntry }))).toEqual([])
  })

  it('takes an entry without details, left out or null', async () => {
    for (const details of [undefined, null]) {
      const eventMatchingEntry = entryOf({ summary: 'Training Rücken', details, remote: false })

      expect(await checksFailing(registration({ eventMatchingEntry }))).toEqual([])
    }
  })

  // Lengths are the schema's: it answers with what it refused. Nothing is cut or refused here.
  it('says nothing about how long the words are', async () => {
    const eventMatchingEntry = entryOf({
      summary: 'x'.repeat(500),
      details: 'd'.repeat(5000),
      remote: true,
    })

    expect(await checksFailing(registration({ eventMatchingEntry }))).toEqual([])
  })

  // GraphQL has refused these before the class is filled; a caller that is not GraphQL has not.
  it('refuses an entry of another shape', async () => {
    expect(
      await checksFailing(
        registration({ eventMatchingEntry: entryOf({ summary: 7, details: null, remote: true }) }),
      ),
    ).toEqual(['isString'])
    expect(
      await checksFailing(
        registration({
          eventMatchingEntry: entryOf({ summary: 'Kongress X', details: null, remote: 'yes' }),
        }),
      ),
    ).toEqual(['isBoolean'])
    expect(
      await checksFailing(
        registration({
          eventMatchingEntry: entryOf({ summary: 'Kongress X', details: ['a'], remote: true }),
        }),
      ),
    ).toEqual(['isString'])
  })
})
