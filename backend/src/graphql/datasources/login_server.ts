import { RESTDataSource } from 'apollo-datasource-rest'

export class LoginServerAPI extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = 'https://api.spacexdata.com/v2/'
  }
}
