/* eslint-disable camelcase */
// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env).
//            The whole contents is exposed to the client

// Load Package Details for some default values
import schema from './schema'
import { validateAndExport } from '../../../config'

const CONFIG = {
  ...validateAndExport(schema),
}

module.exports = CONFIG
