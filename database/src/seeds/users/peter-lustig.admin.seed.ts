import { Factory, Seeder } from 'typeorm-seeding'
import { User } from '../../../entity/User'
import { LoginUser } from '../../../entity/LoginUser'
import { LoginUserBackup } from '../../../entity/LoginUserBackup'
// import { ServerUser } from '../../../entity/ServerUser'

const peterLustig = {
  email: 'peter@lustig.de',
  firstName: 'Peter',
  lastName: 'Lustig',
  username: 'peter',
  description: 'Latzhose und Nickelbrille',
  password: BigInt('3917921995996627700'),
  pubKey: Buffer.from('7281e0ee3258b08801f3ec73e431b4519677f65c03b0382c63a913b5784ee770', 'hex'),
  privKey: Buffer.from(
    '3c7c0253033212ed983f6bb10ce73362a99f0bd01d4d1b21ca702d532ca32710ba36abf72a22a963b9026e764e954f441f4905b87a66861bd6b9d9689b7f8aefea66cc493e21da4244e85be81660b9c4',
    'hex',
  ),
  emailHash: Buffer.from('9f700e6f6ec351a140b674c0edd4479509697b023bd8bee8826915ef6c2af036', 'hex'),
  createdAt: new Date('2021-11-25T10:48:43'),
  emailChecked: true,
  passphraseShown: false,
  language: 'de',
  disabled: false,
  groupId: 1,
  publisherId: null,
  passphrase:
    'okay property choice naive calm present weird increase stuff royal vibrant frame attend wood one else tribe pull hedgehog woman kitchen hawk snack smart ',
  mnemonicType: 2,
  role: 'admin',
  activated: 0,
  lastLogin: new Date('2021-10-27T12:25:57'),
  modified: new Date('2021-10-27T12:25:57'),
  isAdmin: true,
}

export class CreatePeterLustigSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await factory(User)({
      pubkey: peterLustig.pubKey,
      email: peterLustig.email,
      firstName: peterLustig.firstName,
      lastName: peterLustig.lastName,
      username: peterLustig.username,
      disabled: peterLustig.disabled,
    }).create()

    const loginUser = await factory(LoginUser)({
      email: peterLustig.email,
      firstName: peterLustig.firstName,
      lastName: peterLustig.lastName,
      username: peterLustig.username,
      description: peterLustig.description,
      password: peterLustig.password,
      pubKey: peterLustig.pubKey,
      privKey: peterLustig.privKey,
      emailHash: peterLustig.emailHash,
      createdAt: peterLustig.createdAt,
      emailChecked: peterLustig.emailChecked,
      passphraseShown: peterLustig.passphraseShown,
      language: peterLustig.language,
      disabled: peterLustig.disabled,
      groupId: peterLustig.groupId,
      publisherId: peterLustig.publisherId,
    }).create()

    await factory(LoginUserBackup)({
      passphrase: peterLustig.passphrase,
      mnemonicType: peterLustig.mnemonicType,
      userId: loginUser.id,
    }).create()
  }
}
