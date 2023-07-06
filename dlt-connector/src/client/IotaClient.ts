import { ClientBuilder } from '@iota/client'
import { MessageWrapper } from '@iota/client/lib/types'

import CONFIG from '@/config'

const client = new ClientBuilder().node(CONFIG.IOTA_API_URL).build()

/**
 * send data message onto iota tangle
 * use CONFIG.IOTA_COMMUNITY_ALIAS for index
 * @param {string} message - the message as utf based string, will be converted to hex automatically from @iota/client
 * @return {Promise<MessageWrapper>} the iota message typed
 */
function sendDataMessage(message: string): Promise<MessageWrapper> {
  return client.message().index(CONFIG.IOTA_COMMUNITY_ALIAS).data(message).submit()
}

/**
 * receive message for known message id from iota tangle
 * @param {string} messageId - as hex string
 * @return {Promise<MessageWrapper>} the iota message typed
 */
function getMessage(messageId: string): Promise<MessageWrapper> {
  return client.getMessage().data(messageId)
}

export { sendDataMessage, getMessage }

/**
 * example for message: 
```json 
{
  message: {
    networkId: '1454675179895816119',
    parentMessageIds: [
      '5f30efecca59fdfef7c103e85ef691b2b1dc474e9eae9056888a6d58605083e7',
      '77cef2fb405daedcd7469e009bb87a6d9a4840e618cdb599cd21a30a9fec88dc',
      '7d2cfb39f40585ba568a29ad7e85c1478b2584496eb736d4001ac344f6a6cacf',
      'c66da602874220dfa26925f6be540d37c0084d37cd04726fcc5be9d80b36f850'
    ],
    payload: {
      type: 2,
      index: '4752414449444f3a205465737448656c6c6f57656c7431',
      data: '48656c6c6f20576f726c64202d20546875204a756e20303820323032332031343a35393a343520474d542b3030303020284b6f6f7264696e69657274652057656c747a65697429'
    },
    nonce: '13835058055282465157'
  },
  messageId: '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710'
}
```
 */
