/* eslint-disable @typescript-eslint/ban-types */
declare module 'random-bigint' {
  export function random(bits: number, cb?: (err: Error, num: BigInt) => void): BigInt
  // eslint-disable-next-line import/no-default-export
  export default random
}
