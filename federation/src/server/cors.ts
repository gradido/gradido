import { cors as corsPlugin } from '@elysia/cors'

const corsOptions = {
  origin: '*',
  exposeHeaders: ['token'],
  credentials: false,
}

export const cors = corsPlugin(corsOptions)
