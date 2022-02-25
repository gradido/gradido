import { UserInterface } from '../../interface/UserInterface'

export const stephenHawking: UserInterface = {
  email: 'stephen@hawking.uk',
  firstName: 'Stephen',
  lastName: 'Hawking',
  // description: 'A Brief History of Time',
  password: BigInt('18075098469449931746'),
  pubKey: Buffer.from('19576a7aab8cd4ce683ed6735bba937d6bdbd08016568f730a385b6481241213', 'hex'),
  privKey: Buffer.from(
    '1d8ce9b5df086a713fee9eb562adc127073f3211a6214a54e53eb22c1249d49e1e94580ab00f25fd4b38808c1e31b41624ef627f277d21ef5d5717d4b81958f13dc2b257759caba07c6fdbc72f86ab0f',
    'hex',
  ),
  emailHash: Buffer.from('71d4ed7a25d2130d445d6451135eefbbdd96c3105dd297783590ced0bf3116fd', 'hex'),
  createdAt: new Date('1942-01-08T09:17:52'),
  deletedAt: new Date('2018-03-14T09:17:52'),
  emailChecked: true,
  language: 'en',
  passphrase:
    'demise tree praise funny ignore despair vessel shop sorry try day peanut tongue toddler bone december inch chicken clump sheriff weasel rally check suggest ',
  isAdmin: false,
  addBalance: false,
}
