import { Semaphore as DbSemaphore } from "../entity/Semaphore";

export async function createSemaphore(key: string, count: number, owner: string): Promise<DbSemaphore> {
    console.log('createSemaphore: key, count, owner:', key, count, owner);
    let entity: DbSemaphore | null;
    try {
        entity = await DbSemaphore.findOneBy({ key });
        // console.log('createSemaphore: nach findOneBy entity', entity);
        if (entity === null) {
            // console.log('createSemaphore: entity is null');
            entity = DbSemaphore.create({ key, count, owner });
            // console.log('createSemaphore: entity created', entity);
            await DbSemaphore.save(entity);
            console.log('createSemaphore: entity saved', entity);
        }
        else {
            console.log('createSemaphore: entity found', entity);
            // TODO mechanismus zu warten bis entity des anderen owners nicht mehr existiert
        }
    } catch (err) {
        console.log('Failed to create semaphore, search for existing one...');
        entity = await DbSemaphore.findOneBy({ key });
        if (entity === null) {
            // TODO mechanismus zu warten bis entity des anderen owners nicht mehr existiert
        }
    }
    return entity!;
}

export async function increaseSemaphore(entity: DbSemaphore): Promise<DbSemaphore> {
    console.log('increaseSemaphore', entity.key, entity.count, entity.owner);
    try {
        if (entity === null) {
            throw new Error('Semaphore not found');
        }
        entity.count++;
        console.log('increaseSemaphore entity', entity);
        await DbSemaphore.save(entity);
        console.log('increaseSemaphore entity saved', entity);
        return entity;
    } catch (err) {
        console.error('Failed to increase semaphore:', err);
        throw err;
    }
}


export async function decreaseSemaphore(entity: DbSemaphore): Promise<DbSemaphore> {
    console.log('decreaseSemaphore', entity.key, entity.count, entity.owner);
    try {
        if (entity === null) {
            throw new Error('Semaphore not found');
        }
        entity.count--;
        console.log('decreaseSemaphore entity', entity);
        await DbSemaphore.save(entity);
        console.log('decreaseSemaphore entity saved', entity);
        return entity;
    } catch (err) {
        console.error('Failed to decrease semaphore:', err);
        throw err;
    }
}
