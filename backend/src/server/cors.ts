import { cors as corsPlugin } from '@elysia/cors'

// Methods and headers are named here and not left to the plugin: by default it writes the
// method and the header names of each request into its answer. `*` allows every header but
// authorization, which has to be named.
const corsOptions = {
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['*', 'authorization'],
  exposeHeaders: ['token'],
  credentials: false,
}

export const cors = corsPlugin(corsOptions)
