import Decimal from 'decimal.js-light'
import { UserInterface } from '../../interface/UserInterface'

export const bibiBloxberg: UserInterface = {
  email: 'bibi@bloxberg.de',
  firstName: 'Bibi',
  lastName: 'Bloxberg',
  // description: 'Hex Hex',
  password: BigInt('12825419584724616625'),
  pubKey: Buffer.from('42de7e4754625b730018c3b4ea745a4d043d9d867af352d0f08871793dfa6743', 'hex'),
  privKey: Buffer.from(
    '60681365b6ad6fd500eae09ac8df0de6beb7554226e0ca1049e957cc6f202205b86e258bbbe98561a86bd9b986ea8b2a6c60abdff8a745f73c8932d4b6545a8da09bbcd6e18ec61a2ef30bac85f83c5d',
    'hex',
  ),
  emailHash: Buffer.from('38a0d8c8658a5681cc1180c5d9e2b2a18e4f611db8ab3ca61de4aa91ae94219b', 'hex'),
  createdAt: new Date('2021-11-26T11:32:16'),
  emailChecked: true,
  language: 'de',
  passphrase:
    'knife normal level all hurdle crucial color avoid warrior stadium road bachelor affair topple hawk pottery right afford immune two ceiling budget glance hour ',
  isAdmin: false,
  addBalance: true,
  recordDate: new Date('2021-11-30T10:37:11'),
  creationDate: new Date('2021-08-01 00:00:00'),
  amount: new Decimal(1000),
}
