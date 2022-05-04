import DHT from '@hyperswarm/dht'
import { Connection } from '@dbTools/typeorm'

const POLLTIME = 20000
const SUCCESSTIME = 120000
const ERRORTIME = 240000
const ANNOUNCETIME = 30000

export const startDHT = async (connection: Connection, topic: string): Promise<void> => {
  console.log('topic', topic, typeof topic)
  // const TOPIC = DHT.hash(Buffer.from(topic))
}
