import { entities } from "./entity"

export const cleanDB = async () => {
  // this only works as long we do not have foreign key constraints
  for (const entity of entities) {
    if (entity.name !== 'Migration') {
      await resetEntity(entity)
    }
  }
}

export const resetEntity = async (entity: any) => {
  if(entity !== null && entity !== undefined) {
    const items = await entity.count({ withDeleted: true })
    if (items > 0) {
      await entity.clear()
    }
  }
}
