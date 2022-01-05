/*
// Imports
const express = require('express')
const serveStatic = require('serve-static')

// Port
const port = process.env.PORT || 3000

// Express Server
const app = express()
// eslint-disable-next-line node/no-path-concat
app.use(serveStatic(__dirname + '/../dist'))
app.listen(port)

// eslint-disable-next-line no-console
console.log(`http://frontend:${port} server started.`)
*/

const express = require('express')
const path = require('path')

const hostname = '127.0.0.1'
const port = process.env.PORT || 3000

const app = express()
app.use(express.static(path.join(__dirname, '../dist')))

app.get('*', (req, res) => {
  res.sendFile(__dirname, '../dist/index.html')
})

app.listen(port, hostname, () => {
  // eslint-disable-next-line no-console
  console.log('Listening at http://%s:%s/', hostname, port)
})
