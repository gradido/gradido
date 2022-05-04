import DHT from '@hyperswarm/dht'
import { Connection } from '@dbTools/typeorm'

const POLLTIME = 20000
const SUCCESSTIME = 120000
const ERRORTIME = 240000
const ANNOUNCETIME = 30000

export const startDHT = async (connection: Connection, topic: string): Promise<void> => {
  try {
    console.log('topic', topic, typeof topic)
    const buffer = Buffer.from(topic)

    const TOPIC = DHT.hash(buffer)
  } catch (err) {
    console.log(err)
  }
}
