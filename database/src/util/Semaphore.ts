import { Semaphore as DbSemaphore } from "../entity/Semaphore";
import { createSemaphore, decreaseSemaphore, increaseSemaphore } from "../queries/semaphores";
import { Semaphore as AwaitSemaphore } from 'await-semaphore'

const INIT_LOCK = new AwaitSemaphore(1);
let initRelease: (() => void) | null = null;
const ACQUIRE_LOCK = new AwaitSemaphore(1);
let acquireRelease: (() => void) | null = null;
const SHED_LOCK = new AwaitSemaphore(1);
let shedRelease: (() => void) | null = null;

export class Semaphore {
    private tasks: (() => void)[] = [];
    private key: string;
    private count: number;
    private owner: string;
    entity?: DbSemaphore | null;


    private constructor(key: string, count: number, owner: string) {
        // console.log('im constructor key, count, owner:', key, count, owner);
        this.key = key;
        this.count = count;
        this.owner = owner;
        // console.log('constructor finished this=', this);
    }

    // Static factory method to create a new Semaphore
    public static create(key: string, count: number, owner: string): Semaphore {
        // console.log('Semaphore.create key, count, owner:', key, count, owner);
        const semaphore = new Semaphore(key, count, owner);
        // console.log('Semaphore.create: nach constructor semaphore=', semaphore);
        (async () => await semaphore.initDbSemaphore())();
        // console.log('Semaphore.create: nach initDbSemaphore semaphore=', semaphore);
        return semaphore;
    }

    private async initDbSemaphore() {
        initRelease = await INIT_LOCK.acquire();
        try {
            // console.log('initDbSemaphore', this.key, this.count, this.owner);
            this.entity = await createSemaphore(this.key, this.count, this.owner);
            // console.log('initDbSemaphore: nach createSemaphore entity=', this.entity);
            if(this.entity.owner !== this.owner) {
                // console.log('initDbSemaphore different owner=', this.owner);
                // console.log('initDbSemaphore this', this);
                this.count = this.entity.count;
                this.owner = this.entity.owner;
            }
            // console.log('initDbSemaphore finished this=', this);
        } finally {
            initRelease?.();
            initRelease = null;
        }
    }
    private async increaseDbSemaphore() : Promise<void> {
        // console.log('increaseDbSemaphore', this.key, this.count, this.owner, this.entity);
        this.entity = await increaseSemaphore(this.entity!);
    }
    private async decreaseDbSemaphore() : Promise<void> {
        // console.log('decreaseDbSemaphore', this.key, this.count, this.owner, this.entity);
        this.entity = await decreaseSemaphore(this.entity!);
    }

    private async sched() : Promise<void> {
        if (this.count > 0 && this.tasks.length > 0) {
            shedRelease = await SHED_LOCK.acquire();
            try {
                // console.log('shed: owner', this.owner);
                this.count--;
                await this.decreaseDbSemaphore();
                // console.log('after decrease this=', this);
            } finally {
                shedRelease?.();
                shedRelease = null;
            }
            let next = this.tasks.shift();
            // console.log('after shift this=', this);
            if (next === undefined) {
                throw "Unexpected undefined value in tasks list";
            }
            next();
        }
    }

    public acquire() {
        // console.log('acquire this=', this)
        return new Promise<() => void>((res, rej) => {
            var task = () => {
                var released = false;
                res(async () => {
                    if (!released) {
                        acquireRelease = await ACQUIRE_LOCK.acquire();
                        try {
                            // console.log('release: owner', this.owner)
                            released = true;
                            this.count++;
                            await this.increaseDbSemaphore();
                            // console.log('after increase this=', this)
                        } finally {
                            acquireRelease?.();
                            acquireRelease = null;
                        }
                        this.sched();
                        // console.log('after sched this=', this)
                    }
                });
            };
            this.tasks.push(task);
            // console.log('after push this=', this)
            if (process && process.nextTick) {
                // console.log('using process.nextTick: owner=', this.owner);
                process.nextTick(this.sched.bind(this));
            } else {
                // console.log('using setImmediate: owner=', this.owner);
                setImmediate(this.sched.bind(this));
            }
        });
    }

    public use<T>(f: () => Promise<T>) {
        return this.acquire()
        .then(release => {
            return f()
            .then((res) => {
                release();
                return res;
            })
            .catch((err) => {
                release();
                throw err;
            });
        });
    }
}
/*
export class Mutex extends Semaphore {
    constructor(owner: string) {
        super('mutex', 1, owner);
    }
}
*/

/* ************************************
 *                                  *
 *    ORIGINAL SEMAPHORE CODE       *
 *                                  *
 ************************************ */
/*
export class Semaphore {
    private tasks: (() => void)[] = [];
    count: number;

    constructor(count: number) {
        this.count = count;
    }

    private sched() {
        if (this.count > 0 && this.tasks.length > 0) {
            this.count--;
            let next = this.tasks.shift();
            if (next === undefined) {
                throw "Unexpected undefined value in tasks list";
            }

            next();
        }
    }

    public acquire() {
        return new Promise<() => void>((res, rej) => {
            var task = () => {
                var released = false;
                res(() => {
                    if (!released) {
                        released = true;
                        this.count++;
                        this.sched();
                    }
                });
            };
            this.tasks.push(task);
            if (process && process.nextTick) {
                process.nextTick(this.sched.bind(this));
            } else {
                setImmediate(this.sched.bind(this));
            }
        });
    }

    public use<T>(f: () => Promise<T>) {
        return this.acquire()
        .then(release => {
            return f()
            .then((res) => {
                release();
                return res;
            })
            .catch((err) => {
                release();
                throw err;
            });
        });
    }
}

export class Mutex extends Semaphore {
    constructor() {
        super(1);
    }
}
*/
