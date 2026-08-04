import {
  Contribution,
  type CreationInterface,
  creationFactory as creationFactoryDb,
  nMonthsBefore,
} from 'database'

export type { CreationInterface }
export { nMonthsBefore }

export const creationFactory = async (
  _client: any,
  creation: CreationInterface,
): Promise<Contribution> => {
  return creationFactoryDb(creation)
}
