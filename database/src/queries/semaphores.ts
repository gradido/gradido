import { Semaphore as DbSemaphore } from "../entity/Semaphore";
import { CONFIG } from "../config";
import { getLogger } from 'log4js'
import { LOG4JS_QUERIES_CATEGORY_NAME } from './index'

const createLogger = (method: string) => getLogger(`${LOG4JS_QUERIES_CATEGORY_NAME}.semaphores.${method}`)

export async function createSemaphore(key: string, count: number, owner: string): Promise<DbSemaphore> {
    const logger = createLogger('createSemaphore')
    console.log('createSemaphore: key, count, owner:', key, count, owner);
    let entity: DbSemaphore | null;
    const startTime = new Date().getTime();
    do {
        if(startTime + CONFIG.SEMAPHORE_RETRY_TIMEOUT_MS < new Date().getTime()) {
            throw new Error('Timeout creating semaphore');
        }
        console.log('createSemaphore: vor findOneBy key=', key);
        entity = await DbSemaphore.findOneBy({ key });
        console.log('createSemaphore: nach findOneBy entity=', entity);
        if (!entity) {
            try {
                console.log('createSemaphore: vor create key=', key);
                entity = DbSemaphore.create({ key, count, owner });
                console.log('createSemaphore: entity created', entity);
                await DbSemaphore.save(entity);
                console.log('createSemaphore: entity saved', entity);
                return entity;
            } catch (err) {
                console.error('Failed to create semaphore...owner, time=', owner, new Date().toISOString());
                await new Promise(resolve => setTimeout(resolve, CONFIG.SEMAPHORE_RETRY_DELAY_MS))
                console.log('end waiting...owner, time=', owner, new Date().toISOString());
                continue;
            }
        } else {
            console.log('createSemaphore: entity found', entity);
            console.log('DbSemaphore is set...owner, time=', owner, new Date().toISOString());
            await new Promise(resolve => setTimeout(resolve, CONFIG.SEMAPHORE_RETRY_DELAY_MS))
            console.log('end waiting...owner, time=', owner, new Date().toISOString());
            continue;
        }
    } while (true);
}

export async function increaseSemaphore(entity: DbSemaphore | null | undefined): Promise<DbSemaphore> {
    const logger = createLogger('increaseSemaphore')
    console.log('increaseSemaphore', entity);
    try {
        if (!entity) {
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


export async function decreaseSemaphore(entity: DbSemaphore | null | undefined): Promise<DbSemaphore | null> {
    const logger = createLogger('decreaseSemaphore')
    console.log('decreaseSemaphore', entity);
    try {
        if (!entity) {
            throw new Error('Semaphore not found');
        }
        entity.count--;
        console.log('decreaseSemaphore entity', entity);
        if(entity.count <= 0) {
            console.log('...and removing entity', entity)
            await DbSemaphore.remove(entity);
            return null;
        } else {
            console.log('...and saving entity', entity)
            await DbSemaphore.save(entity);
            return entity;
        }
    } catch (err) {
        console.error('Failed to decrease semaphore:', err);
        throw err;
    }
}
