// Imports
const dotenv = require('dotenv')
const express = require('express')
const path = require('path')

dotenv.config() // load env vars from .env

const CONFIG = require('../src/config')

// Host & Port
const hostname = CONFIG.FRONTEND_MODULE_HOST
const port = CONFIG.FRONTEND_MODULE_PORT

// Express Server
const app = express()
// Serve files
app.use(express.static(path.join(__dirname, '../build')))
// Default to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'))
})

app.listen(port, hostname, () => {
  // eslint-disable-next-line no-console
  console.log('Listening at http://%s:%s/', hostname, port)
})
