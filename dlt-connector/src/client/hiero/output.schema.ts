import * as v from 'valibot'
import { dateSchema } from '../../schemas/typeConverter.schema'
import { hieroIdSchema } from '../../schemas/typeGuard.schema'

// schema definitions for exporting data from hiero request as json back to caller
/*export const dateStringSchema = v.pipe(
    v.enum([v.string(), v.date()],
    v.transform(in: string | Date)
    
)*/
export const positiveNumberSchema = v.pipe(v.number(), v.minValue(0))

export const topicInfoSchema = v.object({
  topicId: hieroIdSchema,
  sequenceNumber: positiveNumberSchema,
  expirationTime: dateSchema,
  autoRenewPeriod: v.optional(positiveNumberSchema, 0),
  autoRenewAccountId: v.optional(hieroIdSchema, '0.0.0'),
})

export type TopicInfoOutput = v.InferOutput<typeof topicInfoSchema>
