import { EntityRepository, Repository } from 'typeorm'
import { PendingCreation } from '@entity/PendingCreation'

@EntityRepository(PendingCreation)
export class PendingCreationRepository extends Repository<PendingCreation> {}
