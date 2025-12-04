import {
  Contribution,
  CreationInterface,
  creationFactory as creationFactoryDb,
  nMonthsBefore,
} from 'database'

export { CreationInterface, nMonthsBefore }

export const creationFactory = async (
  _client: any,
  creation: CreationInterface,
): Promise<Contribution> => {
  return creationFactoryDb(creation)
}
