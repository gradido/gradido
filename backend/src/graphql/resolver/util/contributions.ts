import { Contribution } from 'database'

export const findContribution = async (id: number): Promise<Contribution | null> => {
  return Contribution.findOne({ where: { id } })
}
