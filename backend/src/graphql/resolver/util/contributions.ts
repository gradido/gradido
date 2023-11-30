import { Contribution } from '@entity/Contribution'

export const findContribution = async (id: number): Promise<Contribution | null> => {
  return Contribution.findOne({ where: { id } })
}
