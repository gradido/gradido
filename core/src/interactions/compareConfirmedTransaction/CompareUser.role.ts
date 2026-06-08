import { CompareError, VoidResult } from 'shared'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareUserRole extends AbstractCompareConfirmedRole {
  isIdentical(): VoidResult<CompareError> {
    return { success: true }
  }
}
