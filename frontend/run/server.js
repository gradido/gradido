// Imports
const express = require('express')
const path = require('path')

// Host & Port
const hostname = '127.0.0.1'
const port = process.env.PORT || 3000

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
