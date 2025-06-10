import Joi from 'joi'

export const DatabaseConfigSchema = Joi.object({
  DB_CONNECT_RETRY_COUNT: Joi.number()
    .default(15)
    .min(1)
    .max(1000)
    .description('Number of retries to connect to the database')
    .optional(),

  DB_CONNECT_RETRY_DELAY_MS: Joi.number()
    .default(500)
    .min(100)
    .max(10000)
    .description('Delay in milliseconds between retries to connect to the database')
    .optional(),

  TYPEORM_LOGGING_RELATIVE_PATH: Joi.string()
    .pattern(/^[a-zA-Z0-9-_\.\/]+\.log$/)
    .message('TYPEORM_LOGGING_RELATIVE_PATH must be a valid filename ending with .log')
    .description('log file name for logging typeorm activities')
    .default('typeorm.log')
    .optional(),

  DB_HOST: Joi.string()
    .hostname()
    .message('must be a valid host with alphanumeric characters, numbers, points and -')
    .description("database host like 'localhost' or 'mariadb' in docker setup")
    .default('localhost')
    .optional(),

  DB_LOGGING_ACTIVE: Joi.boolean()
    .default(false)
    .description('Enable sql query logging, only for debug, because produce many log entries')
    .optional(),

  DB_LOG_LEVEL: Joi.string()
    .valid('all', 'query', 'schema', 'error', 'warn', 'info', 'log', 'migration')
    .description('set log level')
    .default('info')
    .optional(),

  DB_PORT: Joi.number()
    .integer()
    .min(1024)
    .max(49151)
    .description('database port, default: 3306')
    .default(3306)
    .optional(),

  DB_USER: Joi.string()
    .pattern(/^[A-Za-z0-9]([A-Za-z0-9-_\.]*[A-Za-z0-9])?$/) // Validates MariaDB username rules
    .min(1) // Minimum length 1
    .max(16) // Maximum length 16
    .message(
      'Valid database username (letters, numbers, hyphens, underscores, dots allowed; no spaces, must not start or end with hyphen, dot, or underscore)',
    )
    .description('database username for mariadb')
    .default('root')
    .optional(),

  DB_PASSWORD: Joi.string()
    .when(Joi.ref('NODE_ENV'), {
      is: 'development',
      then: Joi.string().allow(''),
      otherwise: Joi.string()
        .min(8)
        .max(32)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/)
        .message(
          'Password must be between 8 and 32 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g., !@#$%^&*).',
        ),
    })
    .description(
      'Password for the database user. In development mode, an empty password is allowed. In other environments, a complex password is required.',
    )
    .default('')
    .optional(),

  DB_DATABASE: Joi.string()
    .pattern(/^[a-zA-Z][a-zA-Z0-9_-]{1,63}$/)
    .description(
      'Database name like gradido_community (must start with a letter, and can only contain letters, numbers, underscores, or dashes)',
    )
    .default('gradido_community')
    .optional(),
})
