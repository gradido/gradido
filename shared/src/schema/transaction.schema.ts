import * as v from 'valibot'
import { MEMO_MAX_CHARS } from '../const'

export const memoSchema = v.pipe(v.string(), v.maxLength(MEMO_MAX_CHARS))
export type Memo = v.InferOutput<typeof memoSchema>
