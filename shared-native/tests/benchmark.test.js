// biome-ignore-all lint/suspicious/noConsole: measure time
const { describe, it } = require('node:test')
// const { strict } = require('node:assert')
const { MonotonicTimer } = require('../')

const publicKeyString = '3a2c6dd12b203026b20e61e0cc5871e14540a06ec8193ad95b0f287d92d9c670'

describe('benchmarks', () => {
  it('PublicKey ToHex 1k', () => {
    const publicKey = Buffer.from(publicKeyString, 'hex')
    const timeUsed = new MonotonicTimer()
    for (let i = 0; i < 1000; i++) {
      publicKey.toString('hex')
    }
    console.log(`1k toHex: ${timeUsed.toString()}`)
  })
  it('PublicKey FromHex 1k', () => {
    const timeUsed = new MonotonicTimer()
    for (let i = 0; i < 1000; i++) {
      Buffer.from(publicKeyString, 'hex')
    }
    console.log(`1k FromHex: ${timeUsed.toString()}`)
  })
})
