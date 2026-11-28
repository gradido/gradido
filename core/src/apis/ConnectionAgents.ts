import { Agent } from 'node:http'
import { Agent as HttpsAgent } from 'node:https'

export const httpAgent = new Agent({ keepAlive: true })
export const httpsAgent = new HttpsAgent({ keepAlive: true })

// For other communities only: a kept socket skips the lookup that checks its address, so it must
// never be one the agents above opened unchecked.
export const peerHttpAgent = new Agent({ keepAlive: true })
export const peerHttpsAgent = new HttpsAgent({ keepAlive: true })
