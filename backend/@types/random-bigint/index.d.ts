/* eslint-disable @typescript-eslint/ban-types */
declare module 'random-bigint' {
  function random(bits: number, cb?: (err: Error, num: BigInt) => void): BigInt
  export = random
}
