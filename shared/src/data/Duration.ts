export class Duration {
  protected _seconds: bigint

  constructor(seconds: bigint) {
    this._seconds = seconds
  }

  public static fromDateDiff(from: Date, to: Date): Duration {
    return new Duration(BigInt(Math.floor((to.getTime() - from.getTime()) / 1000)))
  }

  get seconds(): bigint {
    return this._seconds
  }
}
