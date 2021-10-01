import { EntityRepository, Repository } from 'typeorm'
import { UserSetting } from '../entity/UserSetting'
import { Setting } from '../../types'
import { isStringBoolean } from '../../util/validate'

@EntityRepository()
export class UserSettingRepository extends Repository<UserSetting> {
  async setOrUpdate(userId: number, key: Setting, value: string): Promise<UserSetting> {
    switch (key) {
      case Setting.COIN_ANIMATION:
        if (!isStringBoolean(value)) {
          throw new Error("coinanimation value isn't boolean")
        }
        break
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
}
