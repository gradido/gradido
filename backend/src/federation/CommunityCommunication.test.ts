import CONFIG from '@/config'
import { openCommunication } from '@/federation/CommunityCommunication'
import { sign } from 'jsonwebtoken'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')

jest.mock('axios', () => ({
  post: jest.fn((_url, _body) => {
    if (_url === CONFIG.BLOCKCHAIN_CONNECTOR_API_URL + '/openCommunication') {
      if (
        sodium.crypto_sign_verify_detached(
          Buffer.from(_body.signature, 'hex'),
          Buffer.from(CONFIG.BLOCKCHAIN_CONNECTOR_PUBLIC_KEY, 'hex'),
          Buffer.from(_body['community-key-A'], 'hex'),
        )
      ) {
        return new Promise((resolve) => {
          const secondsSinceEpoch = Math.floor(new Date().getTime() / 1000)
          resolve({
            status: 200,
            data: {
              state: 'success',
              token: sign(
                {
                  iat: secondsSinceEpoch,
                  // 10 minutes valid
                  exp: secondsSinceEpoch + 600,
                },
                'jwtSecretKey',
              ),
            },
          })
        })
      } else {
        return new Promise((resolve) => {
          resolve({
            status: 200,
            data: {
              state: 'error',
              msg: 'cannot verify signature',
              details: {
                message: CONFIG.BLOCKCHAIN_CONNECTOR_PUBLIC_KEY,
                signature: _body.signature,
              },
            },
          })
        })
      }
    }
    return new Promise((resolve) => {
      resolve({ status: 200, data: { state: 'error', msg: 'url not handled' } })
    })
  }),
}))

describe('federation/CommunityCommunication', () => {
  describe('signWithCommunityPrivateKey', () => {
    it('sign and verify work', async () => {
      await openCommunication(
        CONFIG.BLOCKCHAIN_CONNECTOR_PUBLIC_KEY,
        CONFIG.BLOCKCHAIN_CONNECTOR_API_URL,
      )
    })
  })
})
