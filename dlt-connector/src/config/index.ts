import dotenv from 'dotenv'
import { parse, InferOutput, ValiError } from 'valibot'
import { configSchema } from './schema'

dotenv.config()

type ConfigOutput = InferOutput<typeof configSchema>

let config: ConfigOutput
console.info('Config loading...')
try {
  config = parse(configSchema, process.env)
} catch (error: Error | unknown) {
  if (error instanceof ValiError) {
    console.error(`${error.issues[0].path[0].key}: ${error.message} received: ${error.issues[0].received}`)
  } else {
    console.error(error)
  }
  // console.error('Config error:', JSON.stringify(error, null, 2))
  process.exit(1)
}

export const CONFIG = config
