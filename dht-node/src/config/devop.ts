// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)
import dotenv from 'dotenv'
import { getDevOpEnvValue } from './tools'
dotenv.config()

const DEVOP = {
  FEDERATION_DHT_TOPIC: getDevOpEnvValue('FEDERATION_DHT_TOPIC') || null,
  FEDERATION_DHT_SEED: getDevOpEnvValue('FEDERATION_DHT_SEED') || null,
  HOME_COMMUNITY_PUBLICKEY: getDevOpEnvValue('HOME_COMMUNITY_PUBLICKEY') || null,
  HOME_COMMUNITY_PRIVATEKEY: getDevOpEnvValue('HOME_COMMUNITY_PRIVATEKEY') || null,
}

export default DEVOP
