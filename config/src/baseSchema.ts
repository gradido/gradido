import { z } from 'zod'

export const browserUrls = z.array(z.string().url()).refine(
  (urls) => {
    const protocols = urls.map((url) => new URL(url).protocol)
    return protocols.every((protocol) => protocol === protocols[0])
  },
  {
    message: 'All URLs must use the same protocol (http or https) to prevent mixed content errors',
  },
)

export const DECAY_START_TIME = z
  .string()
  .datetime()
  .describe('The start time for decay, expected in ISO 8601 format (e.g. 2021-05-13T17:46:31Z)')
  .default('2021-05-13T17:46:31Z')

export const DB_VERSION = z
  .string()
  .regex(
    /^\d{4}-[a-z0-9-_]+$/,
    'DB_VERSION must be in the format: YYYY-description, e.g. "0087-add_index_on_user_roles".',
  )
  .describe('db version string, last migration file name without ending or last folder in entity')

export const COMMUNITY_URL = z
  .string()
  .url()
  .describe(
    'The base URL of the community, should have the same protocol as frontend, admin and backend api to prevent mixed contend issues.',
  )
  .default('http://127.0.0.1')

export const GRAPHQL_URL = z
  .string()
  .url()
  .describe(
    `
    The external URL of the backend service,
    accessible from outside the server (e.g., via Nginx or the server's public URL),
    should have the same protocol as frontend and admin to prevent mixed contend issues.
  `,
  )
  .default('http://127.0.0.1/graphql')

export const COMMUNITY_NAME = z.string().min(3)
