import { CompareError, GradidoUnit, VoidResult } from 'shared'

export abstract class CompareConfirmedAbstractRole {
  isIdenticalAmount(
    dbValue?: GradidoUnit | null,
    dltValue?: string | null,
  ): VoidResult<CompareError> {
    let error: CompareError | undefined
    if (!dbValue) {
      error = new CompareError('value from db is missing')
    } else if (!dltValue) {
      error = new CompareError('value from dlt connector is missing')
    } else if (dbValue.comparedTo(GradidoUnit.fromString(dltValue)) !== 0n) {
      error = new CompareError('values differ', `${dbValue.toString(4)} != ${dltValue}`)
    }

    return error ? { success: false, error } : { success: true }
  }
}
