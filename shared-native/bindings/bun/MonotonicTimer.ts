import { ptr, read } from 'bun:ffi'
import { blockchain_core } from './library'

blockchain_core.symbols.grdu_mono_timer_init()

export class MonotonicTimer {
  private timerBuffer = new Int8Array(8)

  public constructor() {
    this.reset()
  }

  public reset(): void {
    const timerBufferPtr = ptr(this.timerBuffer)
    blockchain_core.symbols.grdu_mono_timer_reset(timerBufferPtr)
  }

  public toString(): string {
    const resultBuffer = new Uint8Array(128)
    const resultBufferPtr = ptr(resultBuffer)
    const timerBufferPtr = ptr(this.timerBuffer)
    const written = blockchain_core.symbols.grdu_mono_timer_string(
      resultBufferPtr,
      128,
      read.i64(timerBufferPtr),
    )
    if (written < 0) {
      throw new Error('invalid Timer')
    }
    this.reset()
    return Buffer.from(resultBuffer).toString('utf8').slice(0, written)
  }
}
