const os = require('node:os')

const isBun = typeof process !== 'undefined' && 'bun' in process.versions
const isWindows = os.platform() === 'win32'

if (isBun && isWindows) {
  module.exports = require('./build/shared_native.bun.node')
} else {
  module.exports = require('./build/shared_native.node')
}
