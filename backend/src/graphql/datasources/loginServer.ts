import { RESTDataSource } from 'apollo-datasource-rest'
import CONFIG from '../../config'
import { Group } from '../models/Group'

export class LoginServerAPI extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = CONFIG.LOGIN_API_URL
  }

  async getAllGroupAliases(): Promise<Group[]> {
    return new Promise(() => {
      const response = await this.post('networkInfos', { ask: ['groups'] })
      const groups: Group[] = []
      response.data.forEach((element: string) => {
        const group = new Group()
        group.alias = element
        groups.push(group)
      })(groups)
      return groups
    })
  }
}
