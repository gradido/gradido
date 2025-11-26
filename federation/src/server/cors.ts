import cors from 'cors'

const corsOptions = {
  origin: '*',
  exposedHeaders: ['token'],
}

// biome-ignore lint/style/noDefaultExport: legacy
export default cors(corsOptions)
