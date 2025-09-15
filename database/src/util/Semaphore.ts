import { Semaphore as DbSemaphore } from "../entity/Semaphore";
import { createSemaphore, decreaseSemaphore, increaseSemaphore } from "../queries/semaphores";

export class Semaphore {
    private tasks: (() => void)[] = [];
    private key: string;
    private count: number;
    private owner: string;
    entity?: DbSemaphore | null;

    constructor(key: string, count: number, owner: string) {
        this.key = key;
        this.count = count;
        this.owner = owner;
        this.initDbSemaphore();
    }

    private initDbSemaphore() {
        console.log('initDbSemaphore', this.key, this.count, this.owner);
        this.entity = createSemaphore(this.key, this.count, this.owner);
        if(this.entity.owner === this.owner) {
            this.count = this.entity.count;
            this.owner = this.entity.owner;
        }
    }
    private async increaseDbSemaphore() : Promise<void> {
        console.log('increaseDbSemaphore', this.key, this.count, this.owner);
        this.entity = await increaseSemaphore(this.entity!);
    }
    private async decreaseDbSemaphore() : Promise<void> {
        console.log('decreaseDbSemaphore', this.key, this.count, this.owner);
        this.entity = await decreaseSemaphore(this.entity!);
    }

    private async sched() : Promise<void> {
        if (this.count > 0 && this.tasks.length > 0) {
            this.count--;
            this.decreaseDbSemaphore();
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
                        this.increaseDbSemaphore();
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
    constructor(owner: string) {
        super('mutex', 1, owner);
    }
}


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
