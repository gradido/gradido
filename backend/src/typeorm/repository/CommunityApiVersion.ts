import { Brackets, EntityRepository, ObjectLiteral, Repository } from '@dbTools/typeorm'
import { CommunityApiVersion } from '@entity/CommunityApiVersion'

@EntityRepository(CommunityApiVersion)
export class CommunityApiVersionRepository extends Repository<CommunityApiVersion> {}
