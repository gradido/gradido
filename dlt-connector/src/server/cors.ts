import corsLib from 'cors'

const corsOptions = {
  origin: '*',
  exposedHeaders: ['token'],
}

export const cors = corsLib(corsOptions)
