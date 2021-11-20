import { RIGHTS } from './RIGHTS'

export class Role {
  id: string
  rights: RIGHTS[]

  constructor(id: string, rights: RIGHTS[]) {
    this.id = id
    this.rights = rights
  }
}
