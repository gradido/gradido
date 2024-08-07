// Imports
import CONFIG from '../src/config'

const express = require('express')
const path = require('path')

// Host & Port
const hostname = CONFIG.ADMIN_MODULE_HOST //'127.0.0.1'
const port = CONFIG.ADMIN_MODULE_PORT //process.env.PORT || 8080

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
