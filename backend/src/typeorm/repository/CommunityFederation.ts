import { Brackets, EntityRepository, ObjectLiteral, Repository } from '@dbTools/typeorm'
import { CommunityFederation } from '@entity/CommunityFederation'

@EntityRepository(CommunityFederation)
export class CommunityFederationRepository extends Repository<CommunityFederation> {
  async findMyself(): Promise<CommunityFederation> {
    return this.createQueryBuilder('communityFederation')
      .where('communityFederation.foreign = false')
      .getOneOrFail()
  }

  async findByUuid(uuid: string): Promise<CommunityFederation> {
    return this.createQueryBuilder('communityFederation')
      .where('communityFederation.uuid = :uuid', { uuid })
      .getOneOrFail()
  }

  async findByPubkeyHex(pubkeyHex: string): Promise<CommunityFederation> {
    return this.createQueryBuilder('communityFederation')
      .where('hex(communityFederation.pubKey) = :pubkeyHex', { pubkeyHex })
      .getOneOrFail()
  }
}
