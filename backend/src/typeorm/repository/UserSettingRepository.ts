import { EntityRepository, Repository } from 'typeorm'
import { UserSetting } from '../entity/UserSetting'
import { Setting } from '../../graphql/enum/Setting'
import { isStringBoolean } from '../../util/validate'

@EntityRepository(UserSetting)
export class UserSettingRepository extends Repository<UserSetting> {
  async setOrUpdate(userId: number, key: Setting, value: string): Promise<UserSetting> {
    switch (key) {
      case Setting.COIN_ANIMATION:
        if (!isStringBoolean(value)) {
          throw new Error("coinanimation value isn't boolean")
        }
        break
      default:
        throw new Error("key isn't defined: " + key)
    }
    let entity = await this.findOne({ userId: userId, key: key })

    if (!entity) {
      entity = new UserSetting()
      entity.userId = userId
      entity.key = key
    }
    entity.value = value
    return this.save(entity)
  }

  async readBoolean(userId: number, key: Setting): Promise<boolean> {
    const entity = await this.findOne({ userId: userId, key: key })
    if (!entity || !isStringBoolean(entity.value)) {
      return true
    }
    return entity.value.toLowerCase() === 'true'
  }
}
