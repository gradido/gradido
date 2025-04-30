import cors from 'cors'

const corsOptions = {
  origin: '*',
  exposedHeaders: ['token'],
}

// biome-ignore lint/style/noDefaultExport: <explanation>
export default cors(corsOptions)
