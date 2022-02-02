import { EntityRepository, Repository } from '@dbTools/typeorm'
import { TransactionCreation } from '@entity/TransactionCreation'

@EntityRepository(TransactionCreation)
export class TransactionCreationRepository extends Repository<TransactionCreation> {}
