import { EntityRepository, Repository } from 'typeorm'
import { PendingCreation } from '@entity/PendingCreation'

@EntityRepository(LoginUserBackup)
export class PendingCreationRepository extends Repository<PendingCreation> {
  // TODO: git commit --author="Hannes Heine <heine.hannes@gmail.com>"
}