import { FindOptionsRelations } from '@dbTools/typeorm'
import { DltTransaction } from '@entity/DltTransaction'

// TODO: update with newer typeorm version to match repository class in typeorm doc
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DltTransactionRepository {
  public static findOneByMessageIdWithRelations(
    messageId: string,
    relations?: FindOptionsRelations<DltTransaction>,
  ): Promise<DltTransaction | null> {
    return DltTransaction.findOne({
      where: { messageId },
      relations,
    })
  }
}
