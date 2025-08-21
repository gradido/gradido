// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)

import { LogLevel, validate } from 'config-schema'
import dotenv from 'dotenv'

import { schema } from './schema'

dotenv.config()


const federation = {
  FEDERATION_BACKEND_SEND_ON_API: process.env.FEDERATION_BACKEND_SEND_ON_API ?? '1_0',
  FEDERATION_XCOM_SENDCOINS_ENABLED:
    process.env.FEDERATION_XCOM_SENDCOINS_ENABLED === 'true' || false,
  // default value for community-uuid is equal uuid of stage-3
  FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID:
    process.env.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID ?? '56a55482-909e-46a4-bfa2-cd025e894ebc',
  FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS: parseInt(
    process.env.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS ?? '3',
  ),
}


export const CONFIG = {
  ...federation,
}
validate(schema, CONFIG)
