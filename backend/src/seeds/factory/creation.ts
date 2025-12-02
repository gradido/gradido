import { 
  Contribution,
  creationFactory as creationFactoryDb, 
  CreationInterface, 
  nMonthsBefore 
} from 'database'

export { CreationInterface, nMonthsBefore }

export const creationFactory = async (
  _client: any,
  creation: CreationInterface,
): Promise<Contribution> => {
  return creationFactoryDb(creation)
}
