/**
 * Sleep, that can be interrupted
 * call sleep only for msSteps and than check if interrupt was called
 */
export class InterruptiveSleep {
  private interruptSleep = false
  private msSteps = 10

  constructor(msSteps: number) {
    this.msSteps = msSteps
  }

  public interrupt(): void {
    this.interruptSleep = true
  }

  private static _sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  public async sleep(ms: number): Promise<void> {
    let waited = 0
    this.interruptSleep = false
    while (waited < ms && !this.interruptSleep) {
      await InterruptiveSleep._sleep(this.msSteps)
      waited += this.msSteps
    }
  }
}
