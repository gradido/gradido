import 'reflect-metadata'
import { TransactionErrorType } from '@enum/TransactionErrorType'

import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { GradidoCreation } from './GradidoCreation'

describe('proto/3.3/GradidoCreation', () => {
  it('test with missing targetDate', () => {
    const transactionDraft = new TransactionDraft()
    expect(() => {
      // eslint-disable-next-line no-new
      new GradidoCreation(transactionDraft)
    }).toThrowError(
      new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'missing targetDate for contribution',
      ),
    )
  })
})
