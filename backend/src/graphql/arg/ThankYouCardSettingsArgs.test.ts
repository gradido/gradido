// AI-GENERATED — not an architecture reference
import { getMetadataStorage, validate } from 'class-validator'
import { GradidoUnit } from 'shared'
import {
  ThankYouCardArgs,
  ThankYouCardLimitsArgs,
  ThankYouCardPaymentArgs,
  ThankYouCardSettingsArgs,
} from './ThankYouCardSettingsArgs'

/**
 * ⛔ This file exists because of one bug that no other kind of test could have caught.
 *
 * `createThankYouCardPayment` took its three values as plain `@Arg` parameters, one of them a
 * `GradidoUnit`. That is a CLASS, so type-graphql handed it to class-validator — which, with
 * `forbidUnknownValues: true` (set in `schema.ts`), refuses any object whose class carries no
 * validation metadata at all. The mutation answered every call with "Argument Validation
 * Error" and could never have worked; the resolver was never reached, so no resolver test
 * would have seen it either.
 *
 * The condition below is the one class-validator itself checks — `ValidationExecutor`:
 * `if (forbidUnknownValues && !targetMetadatas.length)`. Asking it directly is the only way
 * to state "this class is known to the validator" as something a test can fail on.
 */

/** The same options the schema is built with, so this asks what the server will ask. */
const SCHEMA_VALIDATION = {
  skipMissingProperties: true,
  skipNullProperties: true,
  skipUndefinedProperties: false,
  forbidUnknownValues: true,
  stopAtFirstError: true,
}

const knownToTheValidator = (target: Function): boolean =>
  getMetadataStorage().getTargetValidationMetadatas(target, '', false, false).length > 0

describe('the argument classes are known to class-validator', () => {
  // ⛔ Every one of them, not only the one that broke: a class that loses its last decorator
  // stops being validated and starts being REFUSED, which looks nothing like the change that
  // caused it.
  it.each([
    ['ThankYouCardSettingsArgs', ThankYouCardSettingsArgs],
    ['ThankYouCardLimitsArgs', ThankYouCardLimitsArgs],
    ['ThankYouCardPaymentArgs', ThankYouCardPaymentArgs],
    ['ThankYouCardArgs', ThankYouCardArgs],
  ])('%s carries validation metadata', (_name, target) => {
    expect(knownToTheValidator(target)).toBe(true)
  })
})

describe('ThankYouCardPaymentArgs', () => {
  const args = (over: Partial<ThankYouCardPaymentArgs> = {}): ThankYouCardPaymentArgs =>
    Object.assign(new ThankYouCardPaymentArgs(), {
      code: 'DK-0123456789abcdef0123456789abcdef',
      amount: GradidoUnit.fromString('12.5'),
      memo: 'Pizzeria Napoli',
      ...over,
    })

  it('accepts what a till actually sends', async () => {
    expect(await validate(args(), SCHEMA_VALIDATION)).toHaveLength(0)
  })

  it('refuses an amount of zero or less', async () => {
    expect(
      await validate(args({ amount: GradidoUnit.fromString('0') }), SCHEMA_VALIDATION),
    ).not.toHaveLength(0)
  })

  // The column is varchar(512); without this the driver reports it, in its own words.
  it('refuses a memo longer than its column', async () => {
    expect(await validate(args({ memo: 'x'.repeat(513) }), SCHEMA_VALIDATION)).not.toHaveLength(0)
  })

  it('refuses an empty code', async () => {
    expect(await validate(args({ code: '' }), SCHEMA_VALIDATION)).not.toHaveLength(0)
  })
})
