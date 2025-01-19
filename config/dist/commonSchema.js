"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCTION = exports.DEBUG = exports.NODE_ENV = exports.BUILD_COMMIT_SHORT = exports.BUILD_COMMIT = exports.APP_VERSION = exports.DB_DATABASE = exports.DB_PASSWORD = exports.DB_USER = exports.DB_PORT = exports.DB_HOST = exports.TYPEORM_LOGGING_RELATIVE_PATH = exports.LOG4JS_CONFIG = exports.LOG_LEVEL = exports.HUMHUB_ACTIVE = exports.GDT_API_URL = exports.GDT_ACTIVE = exports.GMS_ACTIVE = exports.GRAPHIQL = exports.COMMUNITY_LOCATION = exports.COMMUNITY_SUPPORT_MAIL = exports.COMMUNITY_DESCRIPTION = exports.COMMUNITY_NAME = exports.GRAPHQL_URI = exports.COMMUNITY_URL = exports.DB_VERSION = exports.DECAY_START_TIME = exports.browserUrls = void 0;
const joi_1 = __importDefault(require("joi"));
exports.browserUrls = joi_1.default.array()
    .items(joi_1.default.string().uri())
    .custom((value, helpers) => {
    const protocol = new URL(value[0]).protocol;
    for (const url of value) {
        if (new URL(url).protocol !== protocol) {
            return helpers.error('any.invalid');
        }
    }
    return value;
})
    .required()
    .description('All URLs need to have same protocol to prevent mixed block errors');
exports.DECAY_START_TIME = joi_1.default.date()
    .iso() // ISO 8601 format for date validation
    .description('The start time for decay, expected in ISO 8601 format (e.g. 2021-05-13T17:46:31Z)')
    .default(new Date('2021-05-13T17:46:31Z')) // default to the specified date if not provided
    .required();
exports.DB_VERSION = joi_1.default.string()
    .pattern(/^\d{4}-[a-z0-9-_]+$/)
    .message('DB_VERSION must be in the format: YYYY-description, e.g. "0087-add_index_on_user_roles".')
    .description('db version string, last migration file name without ending or last folder in entity')
    .required();
exports.COMMUNITY_URL = joi_1.default.string()
    .uri({ scheme: ['http', 'https'] })
    .custom((value, helpers) => {
    if (value.endsWith('/')) {
        return helpers.error('any.invalid', { message: 'URL should not end with a slash (/)' });
    }
    return value;
})
    .description('The base URL of the community, should have the same protocol as frontend, admin and backend api to prevent mixed contend issues.')
    .default('http://0.0.0.0')
    .required();
exports.GRAPHQL_URI = joi_1.default.string()
    .uri({ scheme: ['http', 'https'] })
    .description(`
    The external URL of the backend service,
    accessible from outside the server (e.g., via Nginx or the server's public URL),
    should have the same protocol as frontend and admin to prevent mixed contend issues.
  `)
    .default('http://0.0.0.0/graphql')
    .required();
exports.COMMUNITY_NAME = joi_1.default.string()
    .min(3)
    .max(100)
    .description('The name of the community')
    .default('Gradido Entwicklung')
    .required();
exports.COMMUNITY_DESCRIPTION = joi_1.default.string()
    .min(10)
    .max(300)
    .description('A short description of the community')
    .default('Die lokale Entwicklungsumgebung von Gradido.')
    .required();
exports.COMMUNITY_SUPPORT_MAIL = joi_1.default.string()
    .email()
    .description('The support email address for the community will be used in frontend and E-Mails')
    .default('support@supportmail.com')
    .required();
exports.COMMUNITY_LOCATION = joi_1.default.string()
    .pattern(/^[-+]?[0-9]{1,2}(\.[0-9]+)?,\s?[-+]?[0-9]{1,3}(\.[0-9]+)?$/)
    .when('GMS_ACTIVE', {
    is: true,
    then: joi_1.default.string().required(),
    otherwise: joi_1.default.string().optional()
})
    .description('Geographical location of the community in "latitude, longitude" format')
    .default('49.280377, 9.690151');
exports.GRAPHIQL = joi_1.default.boolean()
    .description('Flag for enabling GraphQL playground for debugging.')
    .default(false)
    .when('NODE_ENV', {
    is: 'development',
    then: joi_1.default.boolean().valid(true, false).required(), // only allow true in development mode
    otherwise: joi_1.default.boolean().valid(false).required() // false in any other mode
});
exports.GMS_ACTIVE = joi_1.default.boolean()
    .description('Flag to indicate if the GMS (Geographic Member Search) service is used.')
    .default(false)
    .required();
exports.GDT_ACTIVE = joi_1.default.boolean()
    .description('Flag to indicate if the GMS (Geographic Member Search) service is used.')
    .default(false)
    .required();
exports.GDT_API_URL = joi_1.default.string()
    .uri({ scheme: ['http', 'https'] })
    .default('https://gdt.gradido.net')
    .when('GDT_ACTIVE', { is: true, then: joi_1.default.required() })
    .description('The URL for GDT API endpoint');
exports.HUMHUB_ACTIVE = joi_1.default.boolean()
    .description('Flag to indicate if the HumHub based Community Server is used.')
    .default(false)
    .required();
exports.LOG_LEVEL = joi_1.default.string()
    .valid('all', 'mark', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off')
    .description('set log level')
    .default('info')
    .required();
exports.LOG4JS_CONFIG = joi_1.default.string()
    .pattern(/^[a-zA-Z0-9-_]+\.json$/)
    .message('LOG4JS_CONFIG must be a valid filename ending with .json')
    .description('config file name for log4js config file')
    .default('log4js-config.json')
    .required();
exports.TYPEORM_LOGGING_RELATIVE_PATH = joi_1.default.string()
    .pattern(/^[a-zA-Z0-9-_\.]+\.log$/)
    .message('TYPEORM_LOGGING_RELATIVE_PATH must be a valid filename ending with .log')
    .description('log file name for logging typeorm activities')
    .default('typeorm.log')
    .required();
exports.DB_HOST = joi_1.default.string()
    .pattern(/^[a-zA-Z0-9.-]+$/)
    .message('must be a valid host with alphanumeric characters, numbers, points and -')
    .description("database host like 'localhost' or 'mariadb' in docker setup")
    .default('localhost')
    .required();
exports.DB_PORT = joi_1.default.number()
    .integer()
    .min(1024)
    .max(49151)
    .description('database port, default: 3306')
    .default(3306)
    .required();
exports.DB_USER = joi_1.default.string()
    .pattern(/^[A-Za-z0-9]([A-Za-z0-9-_\.]*[A-Za-z0-9])?$/) // Validates MariaDB username rules
    .min(1) // Minimum length 1
    .max(16) // Maximum length 16
    .message('Valid database username (letters, numbers, hyphens, underscores, dots allowed; no spaces, must not start or end with hyphen, dot, or underscore)')
    .description('database username for mariadb')
    .default('root')
    .required();
exports.DB_PASSWORD = joi_1.default.string()
    .when(joi_1.default.ref('NODE_ENV'), {
    is: 'development',
    then: joi_1.default.string().allow(''),
    otherwise: joi_1.default.string()
        .min(8)
        .max(32)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/)
        .message('Password must be between 8 and 32 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g., !@#$%^&*).')
})
    .description('Password for the database user. In development mode, an empty password is allowed. In other environments, a complex password is required.')
    .default('')
    .required();
exports.DB_DATABASE = joi_1.default.string()
    .pattern(/^[a-zA-Z][a-zA-Z0-9_-]{1,63}$/)
    .description('Database name like gradido_community (must start with a letter, and can only contain letters, numbers, underscores, or dashes)')
    .default('gradido_community')
    .required();
exports.APP_VERSION = joi_1.default.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .message('Version must be in the format "major.minor.patch" (e.g., "2.4.1")')
    .description('App Version from package.json, alle modules share one version')
    .required();
exports.BUILD_COMMIT = joi_1.default.string()
    .pattern(/^[0-9a-f]{40}$/)
    .message('The commit hash must be a 40-character hexadecimal string.')
    .description('The full git commit hash.')
    .optional();
exports.BUILD_COMMIT_SHORT = joi_1.default.string()
    .pattern(/^[0-9a-f]{7}$/)
    .message('The first 7 hexadecimal character from git commit hash.')
    .description('A short version from the git commit hash.')
    .required();
exports.NODE_ENV = joi_1.default.string()
    .valid('production', 'development', 'test')
    .default('development')
    .description('Specifies the environment in which the application is running.');
exports.DEBUG = joi_1.default.boolean()
    .description('Indicates whether the application is in debugging mode. Set to true when NODE_ENV is not "production".')
    .default(false)
    .required();
exports.PRODUCTION = joi_1.default.boolean()
    .default(false)
    .description('Indicates whether the application is running in production mode. Set to true when NODE_ENV is "production".')
    .required();
