import { bibiBloxberg } from './bibi-bloxberg'
import { bobBaumeister } from './bob-baumeister'
import { garrickOllivander } from './garrick-ollivander'
import { peterLustig } from './peter-lustig'
import { raeuberHotzenplotz } from './raeuber-hotzenplotz'
import { stephenHawking } from './stephen-hawking'
import { UserInterface } from './UserInterface'

export { 
  type UserInterface, 
  bibiBloxberg, 
  bobBaumeister, 
  garrickOllivander, 
  peterLustig, 
  raeuberHotzenplotz, 
  stephenHawking 
}

export const users: UserInterface[] = [
  peterLustig,
  bibiBloxberg,
  bobBaumeister,
  raeuberHotzenplotz,
  stephenHawking,
  garrickOllivander,
]
