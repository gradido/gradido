import { Agent } from 'http'
import { Agent as HttpsAgent } from 'https'

// enforce ipv4, because of hard to debug problems with ipv6
export const httpAgent = new Agent({ family: 4, keepAlive: true })
export const httpsAgent = new HttpsAgent({ family: 4, keepAlive: true })
