import { UserInterface } from '../../interface/UserInterface'

export const garrickOllivander: UserInterface = {
  email: 'garrick@ollivander.com',
  firstName: 'Garrick',
  lastName: 'Ollivander',
  // description: `Curious ... curious ...
  // Renowned wandmaker Mr Ollivander owns the wand shop Ollivanders: Makers of Fine Wands Since 382 BC in Diagon Alley. His shop is widely considered the best place to purchase a wand.`,
  password: BigInt('0'),
  emailHash: Buffer.from('91e358000e908146342789979d62a7255b2b88a71dad0c6a10e32af44be57886', 'hex'),
  createdAt: new Date('2022-01-10T10:23:17'),
  emailChecked: false,
  language: 'en',
  passphrase:
    'human glide theory clump wish history other duty door fringe neck industry ostrich equal plate diesel tornado neck people antenna door category moon hen ',
  isAdmin: false,
  addBalance: false,
}
