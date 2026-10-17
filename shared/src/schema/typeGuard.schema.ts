import * as v from 'valibot'

/**
 * # TypeGuards
 * Expand TypeScript Default Types with custom type which a based on a default type (or class)
 * Use valibot, so we can describe the type and validate it easy at runtime
 * After transpiling TypeScript unique symbol are gone
 * Infos at opaque type in typescript: https://evertpot.com/opaque-ts-types/
 *
 * declare const validAmount: unique symbol
 * export type Amount = number & { [validAmount]: true };
 * Can be compared with using `typedef int Amount;` in C/C++
 * Example:
 * To create a instance of Amount:
 * `const amount: Amount = v.parse(amountSchema, 1.21)`
 * must be called and ensure the value is valid
 * If it isn't valid, v.parse will throw an error
 * Alternatively v.safeParse can be used, this don't throw but it return null on error
 */

/**
 * type guard for hiero id
 * create with `v.parse(hieroIdSchema, '0.0.2')`
 * hiero id is a hiero id of the form 0.0.2
 */
declare const validHieroId: unique symbol
// an interface, not an inline type literal: a declaration file can refer to it by name,
// while the unique symbol key of an inlined literal cannot be named outside this module (TS4023)
export interface HieroIdBrand {
  [validHieroId]: true
}
export type HieroId = string & HieroIdBrand

export const hieroIdSchema = v.pipe(
  v.string('expect hiero id type, three 64 Bit Numbers separated by . for example 0.0.2'),
  v.regex(/^[0-9]+\.[0-9]+\.[0-9]+$/),
  v.transform<string, HieroId>((input: string) => input as HieroId),
)

export type HieroIdInput = v.InferInput<typeof hieroIdSchema>
