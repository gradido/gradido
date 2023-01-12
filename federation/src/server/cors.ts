import cors from 'cors'

const corsOptions = {
  origin: '*',
  exposedHeaders: ['token'],
}

export default cors(corsOptions)
