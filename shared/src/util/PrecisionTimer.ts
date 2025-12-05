export class PrecisionTimer {
	private startTick: [number, number]

	constructor(private decimals = 3) {
		this.reset()
	}

	reset(): void {
		this.startTick = process.hrtime()
	}

	/**
	 * @returns The elapsed time in milliseconds.
	 */
	millis(): number {
		const elapsed = process.hrtime(this.startTick)
		return elapsed[0] * 1000 + elapsed[1] / 1000000
	}

	/**
	 * @returns The elapsed time in microseconds.
	 */
	micros(): number {
		const elapsed = process.hrtime(this.startTick)
		return elapsed[0] * 1000000 + elapsed[1] / 1000
	}

	/**
	 * @returns The elapsed time in nanoseconds.
	 */
	nanos(): number {
		const elapsed = process.hrtime(this.startTick)
		return elapsed[0] * 1000000000 + elapsed[1]
	}

	/**
	 * @returns The elapsed time in seconds.
	 */
	seconds(): number {
		const elapsed = process.hrtime(this.startTick)
		return elapsed[0] + elapsed[1] / 1000000000
	}

	/**
	 * @returns A string representation of the elapsed time.
	 */
	toString(): string {
		// elapsed[0] is seconds, elapsed[1] is nanoseconds
		const elapsed = process.hrtime(this.startTick)

		// less than 1 second
		if (elapsed[0] === 0) {
			// less than 1 microsecond
			if (elapsed[1] < 1000) {
				return `${elapsed[1]} ns`
			}
			// less than 1 millisecond
			if (elapsed[1] < 1000000) {
				return `${(elapsed[1] / 1000).toFixed(this.decimals)} μs`
			}
			return `${(elapsed[1] / 1000000).toFixed(this.decimals)} ms`
		}

		// more than 1 second
		return `${(elapsed[0] + elapsed[1] / 1000000000).toFixed(this.decimals)} s`
	}
}