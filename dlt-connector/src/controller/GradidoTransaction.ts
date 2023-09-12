import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/proto/3_3/TransactionBody'

export const create = (body: TransactionBody): GradidoTransaction => {
  const transaction = new GradidoTransaction({
    bodyBytes: Buffer.from(TransactionBody.encode(body).finish()),
  })
  // TODO: add correct signature(s)
  return transaction
}

// export const sign = (transaction: GradidoTransaction, signer: )
