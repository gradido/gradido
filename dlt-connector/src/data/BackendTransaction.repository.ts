import { BackendTransaction } from '@entity/BackendTransaction'

import { getDataSource } from '@/typeorm/DataSource'

export const BackendTransactionRepository = getDataSource()
  .getRepository(BackendTransaction)
  .extend({})
