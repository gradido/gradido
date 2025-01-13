import { Agent } from 'http'
import { Agent as HttpsAgent } from 'https'

export const httpAgent = new Agent({ keepAlive: true })
export const httpsAgent = new HttpsAgent({ keepAlive: true })
