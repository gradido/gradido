
declare module 'random-bigint' {
  function random(bits: number, cb?: (err: Error, num: bigint) => void): bigint
  export = random
}
