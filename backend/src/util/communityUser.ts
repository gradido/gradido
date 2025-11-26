import { User } from '@model/User'
import { User as dbUser, UserContact } from 'database'
import { RemoveOptions, SaveOptions } from 'typeorm'

import { PasswordEncryptionType } from '@/graphql/enum/PasswordEncryptionType'

// import { UserContact as EmailContact } from 'database'

const communityDbUser: dbUser = {
  id: -1,
  gradidoID: '11111111-2222-4333-4444-55555555',
  alias: '',
  // email: 'support@gradido.net',
  emailContact: new UserContact(),
  emailId: -1,
  firstName: 'Gradido',
  lastName: 'Akademie',
  deletedAt: null,
  password: BigInt(0),
  hideAmountGDD: false,
  hideAmountGDT: false,
  //  emailHash: Buffer.from(''),
  createdAt: new Date(),
  // emailChecked: false,
  language: '',
  userRoles: [],
  publisherId: 0,
  // default password encryption type
  passwordEncryptionType: PasswordEncryptionType.NO_PASSWORD,
  hasId: function (): boolean {
    throw new Error('Function not implemented.')
  },
  save: function (_options?: SaveOptions): Promise<dbUser> {
    throw new Error('Function not implemented.')
  },
  remove: function (_options?: RemoveOptions): Promise<dbUser> {
    throw new Error('Function not implemented.')
  },
  softRemove: function (_options?: SaveOptions): Promise<dbUser> {
    throw new Error('Function not implemented.')
  },
  recover: function (_options?: SaveOptions): Promise<dbUser> {
    throw new Error('Function not implemented.')
  },
  reload: function (): Promise<void> {
    throw new Error('Function not implemented.')
  },
  foreign: false,
  communityUuid: '55555555-4444-4333-2222-11111111',
  community: null,
  gmsPublishName: 0,
  humhubPublishName: 0,
  gmsAllowed: false,
  humhubAllowed: false,
  location: null,
  gmsPublishLocation: 2,
  gmsRegistered: false,
  gmsRegisteredAt: null,
}
const communityUser = new User(communityDbUser)

export { communityDbUser, communityUser }
