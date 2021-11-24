import { EntityRepository, Repository } from 'typeorm'
import { PendingCreation } from '@entity/PendingCreation'

@EntityRepository(LoginUserBackup)
export class PendingCreationRepository extends Repository<PendingCreation> {}
