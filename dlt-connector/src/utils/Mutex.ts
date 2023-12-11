/**
 * written von ChatGPT 3.5
 */
export class Mutex {
  private isLocked: boolean
  private waitingQueue: (() => void)[]

  constructor() {
    this.isLocked = false
    this.waitingQueue = []
  }

  lock(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isLocked) {
        this.isLocked = true
        resolve()
      } else {
        this.waitingQueue.push(resolve)
      }
    })
  }

  unlock(): void {
    if (this.waitingQueue.length > 0) {
      const nextResolve = this.waitingQueue.shift()
      if (nextResolve) {
        nextResolve()
      }
    } else {
      this.isLocked = false
    }
  }
}
