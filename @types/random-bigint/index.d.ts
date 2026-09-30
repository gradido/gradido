
declare module 'random-bigint' {
  function random(bits: number): bigint
  function random(bits: number, cb: (err: Error | null, num?: bigint) => void): void
  export = random
}
