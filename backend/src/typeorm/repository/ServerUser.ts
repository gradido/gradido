import { EntityRepository, Repository } from 'typeorm'
import { ServerUser } from '@entity/ServerUser'

@EntityRepository(ServerUser)
export class ServerUserRepository extends Repository<ServerUser> {}
