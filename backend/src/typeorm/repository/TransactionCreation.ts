import { EntityRepository, Repository } from 'typeorm'
import { TransactionCreation } from '@entity/TransactionCreation'

@EntityRepository(TransactionCreation)
export class TransactionCreationRepository extends Repository<TransactionCreation> {}
