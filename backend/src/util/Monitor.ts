export class Monitor {
  private static lock = false

  // eslint-disable-next-line no-useless-constructor, @typescript-eslint/no-empty-function
  private constructor() {}

  public static isLocked = (): boolean => {
    return Monitor.lock
  }

  public static lockIt(): void {
    Monitor.lock = true
  }

  public static releaseIt(): void {
    Monitor.lock = false
  }
}
