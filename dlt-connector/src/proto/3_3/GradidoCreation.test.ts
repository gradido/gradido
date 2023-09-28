import 'reflect-metadata'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { GradidoCreation } from './GradidoCreation'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@enum/TransactionErrorType'

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
