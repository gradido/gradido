import { Brackets, EntityRepository, ObjectLiteral, Repository } from '@dbTools/typeorm'
import { Community } from '@entity/Community'

@EntityRepository(Community)
export class CommunityRepository extends Repository<Community> {
  async findByUuid(uuid: string): Promise<Community> {
    return this.createQueryBuilder('community')
      .where('community.uuid = :uuid', { uuid })
      .getOneOrFail()
  }

  async findByName(name: string): Promise<Community> {
    return this.createQueryBuilder('community')
      .where('community.name = :name', { name })
      .getOneOrFail()
  }
}
