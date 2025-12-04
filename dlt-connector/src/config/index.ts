import dotenv from 'dotenv'
import * as v from 'valibot'
import { configSchema } from './schema'

dotenv.config()

type ConfigOutput = v.InferOutput<typeof configSchema>

let config: ConfigOutput
try {
  config = v.parse(configSchema, process.env)
} catch (error) {
  if (error instanceof v.ValiError) {
    // biome-ignore lint/suspicious/noConsole: need to parse config before initializing logger
    console.error(
      `${error.issues[0].path[0].key}: ${error.message} received: ${error.issues[0].received}`,
    )
  } else {
    // biome-ignore lint/suspicious/noConsole: need to parse config before initializing logger
    console.error(error)
  }
  process.exit(1)
}

export const CONFIG = config
