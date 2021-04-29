// Imports
const express = require('express')
const serveStatic = require('serve-static')

// Port
const port = process.env.PORT || 3000

// Express Server
const app = express()
app.use(serveStatic(__dirname + '/../dist'))
app.listen(port)

// eslint-disable-next-line no-console
console.log(`http://frontend:${port} server started.`)
