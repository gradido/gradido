import * as v from 'valibot'
import {
  booleanSchema,
  hostnameSchema,
  nonEmptyStringSchema,
  numberSchema,
  portSchema,
} from './base.schema'
import { NODE_ENV } from './common.schema'
import { configRule } from './rules'

const DB_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/

const isComplexPassword = (password: string): boolean =>
  password.length >= 8 && password.length <= 32 && DB_PASSWORD_PATTERN.test(password)

export const DatabaseConfigSchema = v.pipe(
  v.strictObject({
    // read by the DB_PASSWORD rule
    NODE_ENV,

    DB_CONNECT_RETRY_COUNT: v.optional(
      v.pipe(
        numberSchema,
        v.minValue(1),
        v.maxValue(1000),
        v.description('Number of retries to connect to the database'),
      ),
    ),

    DB_CONNECT_RETRY_DELAY_MS: v.optional(
      v.pipe(
        numberSchema,
        v.minValue(100),
        v.maxValue(10000),
        v.description('Delay in milliseconds between retries to connect to the database'),
      ),
    ),

    TYPEORM_LOGGING_RELATIVE_PATH: v.optional(
      v.pipe(
        nonEmptyStringSchema,
        v.regex(
          /^[a-zA-Z0-9-_\.\/]+\.log$/,
          'TYPEORM_LOGGING_RELATIVE_PATH must be a valid filename ending with .log',
        ),
        v.description('log file name for logging typeorm activities'),
      ),
    ),

    DB_HOST: v.optional(
      v.pipe(
        hostnameSchema,
        v.description("database host like 'localhost' or 'mariadb' in docker setup"),
      ),
    ),

    DB_LOGGING_ACTIVE: v.optional(
      v.pipe(
        booleanSchema,
        v.description('Enable sql query logging, only for debug, because produce many log entries'),
      ),
    ),

    DB_LOG_LEVEL: v.optional(
      v.pipe(
        v.picklist(['all', 'query', 'schema', 'error', 'warn', 'info', 'log', 'migration']),
        v.description('set log level'),
      ),
    ),

    DB_PORT: v.optional(v.pipe(portSchema, v.description('database port, default: 3306'))),

    DB_USER: v.optional(
      v.pipe(
        nonEmptyStringSchema,
        // MariaDB username rules
        v.regex(
          /^[A-Za-z0-9]([A-Za-z0-9-_\.]*[A-Za-z0-9])?$/,
          'Valid database username (letters, numbers, hyphens, underscores, dots allowed; no spaces, must not start or end with hyphen, dot, or underscore)',
        ),
        v.maxLength(16),
        v.description('database username for mariadb'),
      ),
    ),

    DB_PASSWORD: v.optional(
      v.pipe(
        v.string(),
        v.description(
          'Password for the database user. In development mode, an empty password is allowed. In other environments, a complex password is required.',
        ),
      ),
    ),

    DB_DATABASE: v.optional(
      v.pipe(
        nonEmptyStringSchema,
        v.regex(/^[a-zA-Z][a-zA-Z0-9_-]{1,63}$/),
        v.description(
          'Database name like gradido_community (must start with a letter, and can only contain letters, numbers, underscores, or dashes)',
        ),
      ),
    ),
  }),
  configRule(
    'DB_PASSWORD',
    (config) =>
      config.NODE_ENV === 'development' ||
      config.DB_PASSWORD === undefined ||
      isComplexPassword(config.DB_PASSWORD),
    'Password must be between 8 and 32 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g., !@#$%^&*).',
  ),
)
