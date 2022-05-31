import { EntityRepository, Repository } from '@dbTools/typeorm'
import { UserSetting } from '@entity/UserSetting'
import { isStringBoolean } from '@/util/validate'

@EntityRepository(UserSetting)
export class UserSettingRepository extends Repository<UserSetting> {
  async setOrUpdate(userId: number, value: string): Promise<UserSetting> {
    let entity = await this.findOne({ userId: userId })

    if (!entity) {
      entity = new UserSetting()
      entity.userId = userId
    }
    entity.value = value
    return this.save(entity)
  }

  async readBoolean(userId: number): Promise<boolean> {
    const entity = await this.findOne({ userId: userId })
    if (!entity || !isStringBoolean(entity.value)) {
      return true
    }
    return entity.value.toLowerCase() === 'true'
  }
}
