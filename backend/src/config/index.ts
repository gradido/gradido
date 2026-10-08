// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)

import { parseConfig } from 'config-schema'
import dotenv from 'dotenv'

import { schema } from './schema'

dotenv.config()

export const CONFIG = parseConfig(schema, process.env)

// This is needed by graphql-directive-auth
process.env.APP_SECRET = CONFIG.JWT_SECRET
