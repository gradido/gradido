import { Brackets, EntityRepository, ObjectLiteral, Repository } from '@dbTools/typeorm'
import { User as DbUser } from '@entity/User'

@EntityRepository(DbUser)
export class UserRepository extends Repository<DbUser> {
  async findByPubkeyHex(pubkeyHex: string): Promise<DbUser> {
    const dbUser = await this.createQueryBuilder('user')
      .where('hex(user.pubKey) = :pubkeyHex', { pubkeyHex })
      .getOneOrFail()
    /*
    const dbUser = await this.findOneOrFail(`hex(user.pubKey) = { pubkeyHex }`)
    const emailContact = await this.query(
      `SELECT * from user_contacts where id = { dbUser.emailId }`,
    )
    dbUser.emailContact = emailContact
    */
    return dbUser
  }

  async findBySearchCriteriaPagedFiltered(
    select: string[],
    searchCriteria: string,
    filterCriteria: ObjectLiteral[],
    currentPage: number,
    pageSize: number,
  ): Promise<[DbUser[], number]> {
    const query = await this.createQueryBuilder('user')
      .select(select)
      .withDeleted()
      .where(
        new Brackets((qb) => {
          qb.where(
            'user.firstName like :name or user.lastName like :lastName or user.email like :email',
            {
              name: `%${searchCriteria}%`,
              lastName: `%${searchCriteria}%`,
              email: `%${searchCriteria}%`,
            },
          )
        }),
      )
    filterCriteria.forEach((filter) => {
      query.andWhere(filter)
    })
    return query
      .take(pageSize)
      .skip((currentPage - 1) * pageSize)
      .getManyAndCount()
  }
}
