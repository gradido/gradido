import path from 'node:path'
import { MemoryBlock } from 'gradido-blockchain-js'
import * as v from 'valibot'

const hexSchema = v.pipe(v.string('expect string type'), v.hexadecimal('expect hexadecimal string'))

const hex16Schema = v.pipe(hexSchema, v.length(32, 'expect string length = 32'))

export const configSchema = v.object({
  LOG4JS_CONFIG: v.optional(
    v.string('The path to the log4js configuration file'),
    './log4js-config.json',
  ),
  LOG_LEVEL: v.optional(v.string('The log level'), 'info'),
  DLT_CONNECTOR_PORT: v.optional(
    v.pipe(
      v.string('A valid port on which the DLT connector is running'),
      v.transform<string, number>((input: string) => Number(input)),
      v.minValue(1),
      v.maxValue(65535),
    ),
    '6010',
  ),
  JWT_SECRET: v.optional(
    v.pipe(
      v.string('The JWT secret for connecting to the backend'),
      v.custom((input: unknown): boolean => {
        if (process.env.NODE_ENV === 'production' && input === 'secret123') {
          return false
        }
        return true
      }, "Shouldn't use default value in production"),
    ),
    'secret123',
  ),
  GRADIDO_BLOCKCHAIN_CRYPTO_APP_SECRET: hexSchema,
  GRADIDO_BLOCKCHAIN_SERVER_CRYPTO_KEY: hex16Schema,
  HOME_COMMUNITY_SEED: v.pipe(
    hexSchema,
    v.length(64, 'expect seed length minimum 64 characters (32 Bytes)'),
    v.transform<string, MemoryBlock>((input: string) => MemoryBlock.fromHex(input)),
  ),
  HIERO_HEDERA_NETWORK: v.optional(
    v.union([v.literal('mainnet'), v.literal('testnet'), v.literal('previewnet')]),
    'testnet',
  ),
  HIERO_OPERATOR_ID: v.pipe(
    v.string('The operator ID (Account id) for Hiero integration'),
    v.regex(/^[0-9]+\.[0-9]+\.[0-9]+$/),
  ),
  HIERO_OPERATOR_KEY: v.pipe(
    v.string('The operator key (Private key) for Hiero integration'),
    v.hexadecimal(),
    v.minLength(64),
    v.maxLength(96),
  ),
  CONNECT_TIMEOUT_MS: v.optional(
    v.pipe(v.number('The connection timeout in milliseconds'), v.minValue(200), v.maxValue(120000)),
    1000,
  ),
  CONNECT_RETRY_COUNT: v.optional(
    v.pipe(v.number('The connection retry count'), v.minValue(1), v.maxValue(50)),
    15,
  ),
  CONNECT_RETRY_DELAY_MS: v.optional(
    v.pipe(
      v.number('The connection retry delay in milliseconds'),
      v.minValue(100),
      v.maxValue(10000),
    ),
    500,
  ),
  DLT_NODE_SERVER_PORT: v.optional(
    v.pipe(
      v.string('A valid port on which the DLT node server is running'),
      v.transform<string, number>((input: string) => Number(input)),
      v.minValue(1),
      v.maxValue(65535),
    ),
    '8340',
  ),
  DLT_GRADIDO_NODE_SERVER_VERSION: v.optional(
    v.pipe(
      v.string('The version of the DLT node server, for example: 0.9.0'),
      v.regex(/^\d+\.\d+\.\d+$/),
    ),
    '0.9.0',
  ),
  DLT_GRADIDO_NODE_SERVER_HOME_FOLDER: v.optional(
    v.string('The home folder for the gradido dlt node server'),
    path.join(__dirname, '..', '..', 'gradido_node'),
  ),
  BACKEND_PORT: v.optional(
    v.pipe(
      v.string('A valid port on which the backend server is running'),
      v.transform<string, number>((input: string) => Number(input)),
      v.minValue(1),
      v.maxValue(65535),
    ),
    '4000',
  ),
  MYSQL_HOST: v.optional(
    v.string('The host of the database'),
    'localhost',
  ),
  MYSQL_PORT: v.optional(
    v.pipe(
      v.string('The port of the database'),
      v.transform<string, number>((input: string) => Number.parseInt(input)),
      v.minValue(1),
      v.maxValue(65535),
    ),
    '3306',
  ),
  MYSQL_USER: v.optional(
    v.pipe(
      v.string('The user name of the database'),
      v.custom((input: unknown): boolean => {
        if (process.env.NODE_ENV === 'production' && input === 'root') {
          return false
        }
        return true
      }, "Shouldn't use default root user in production"),
    ),
    'root',
  ),
  MYSQL_PASSWORD: v.optional(
    v.pipe(
      v.string('The password of the database'),
      v.custom((input: unknown): boolean => {
        if (process.env.NODE_ENV === 'production' && input === '') {
          return false
        }
        return true
      }, "Shouldn't use empty password in production"),
    ),
    '',
  ),
  MYSQL_DATABASE: v.optional(
    v.string('The name of the database'),
    'gradido_community',
  ),
})
