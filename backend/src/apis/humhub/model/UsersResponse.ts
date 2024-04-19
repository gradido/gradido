import { GetUser } from './GetUser'

export class UsersResponse {
  total: number
  page: number
  results: GetUser[]
}
