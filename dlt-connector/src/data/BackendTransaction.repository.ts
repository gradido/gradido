import { BackendTransaction } from '@entity/BackendTransaction'
import { FindOptionsRelations } from 'typeorm'

import { getDataSource } from '@/typeorm/DataSource'

export const BackendTransactionRepository = getDataSource()
  .getRepository(BackendTransaction)
  .extend({
    async getByBackendTransactionId(
      backendTransactionId: number,
      relations?: FindOptionsRelations<BackendTransaction>,
    ): Promise<BackendTransaction | null> {
      return this.findOne({
        where: { backendTransactionId },
        relations,
      })
    },
  })
