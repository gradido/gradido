import { Semaphore as DbSemaphore } from "../entity/Semaphore";

export async function createSemaphore(key: string, count: number, owner: string): Promise<DbSemaphore> {
    try {
        let entity = await DbSemaphore.findOneBy({ key });
        if (!entity) {
            entity = DbSemaphore.create({ key, count, owner });
            await entity.save();
        }
        return entity;
    } catch (err) {
        console.error('Failed to create semaphore:', err);
        throw err;
    }
}

export async function increaseSemaphore(entity: DbSemaphore): Promise<DbSemaphore> {
    try {
        if (!entity) {
            throw new Error('Semaphore not found');
        }
        entity.count++;
        await DbSemaphore.save(entity);
        return entity;
    } catch (err) {
        console.error('Failed to increase semaphore:', err);
        throw err;
    }
}


export async function decreaseSemaphore(entity: DbSemaphore): Promise<DbSemaphore> {
    try {
        if (!entity) {
            throw new Error('Semaphore not found');
        }
        entity.count--;
        await DbSemaphore.save(entity);
        return entity;
    } catch (err) {
        console.error('Failed to decrease semaphore:', err);
        throw err;
    }
}
