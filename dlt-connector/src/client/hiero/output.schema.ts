import * as v from 'valibot'
import { hieroIdSchema } from '../../schemas/typeGuard.schema'

// schema definitions for exporting data from hiero request as json back to caller 
/*export const dateStringSchema = v.pipe(
    v.enum([v.string(), v.date()],
    v.transform(in: string | Date)
    
)*/
export const dateStringSchema = v.pipe(
  v.union([v.string('expect valid date string'), v.instance(Date, 'expect Date object')]),
  v.transform<string | Date, string>((input) => {
    let date: Date
    if (input instanceof Date) {
      date = input
    } else {
      date = new Date(input)
    }
    if (isNaN(date.getTime())) {
      throw new Error('invalid date')
    }
    return date.toISOString()
  }),
)

export const positiveNumberSchema = v.pipe(v.number(), v.minValue(0))

export const topicInfoSchema = v.object({
    topicId: hieroIdSchema,
    sequenceNumber: positiveNumberSchema,
    expirationTime: dateStringSchema,
    autoRenewPeriod: v.optional(positiveNumberSchema, 0),
    autoRenewAccountId: v.optional(hieroIdSchema, '0.0.0'),
})

export type TopicInfoOutput = v.InferOutput<typeof topicInfoSchema>

