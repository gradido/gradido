import { FindOptionsRelations } from '@dbTools/typeorm'
import { Transaction } from '@entity/Transaction'

// TODO: update with newer typeorm version to match repository class in typeorm doc
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TransactionRepository {
  static findOneByIdWithRelations(
    id: number,
    relations?: FindOptionsRelations<Transaction>,
  ): Promise<Transaction | null> {
    return Transaction.findOne({
      where: { id },
      relations,
    })
  }
}
