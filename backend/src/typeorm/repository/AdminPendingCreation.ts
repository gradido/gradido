import { EntityRepository, Repository } from 'typeorm'
import { AdminPendingCreation } from '@entity/AdminPendingCreation'

@EntityRepository(AdminPendingCreation)
export class AdminPendingCreationRepository extends Repository<AdminPendingCreation> {}
