export class ConditionalSleep {
  private conditionState = false
  private stepSize = 10

  constructor(stepSize: number) {
    this.stepSize = stepSize
  }

  public signal(): void {
    this.conditionState = true
  }

  private static _sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  public async sleep(ms: number): Promise<void> {
    let waited = 0
    this.conditionState = false
    while (waited < ms && !this.conditionState) {
      await ConditionalSleep._sleep(this.stepSize)
      waited += this.stepSize
    }
  }
}
