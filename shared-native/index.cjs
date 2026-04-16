const isBun = typeof process !== 'undefined' && 'bun' in process.versions

if (!isBun) {
  module.exports = require('./build/shared_native.node')
} else {
  module.exports = require('./src/napi/gradido_unit_bun_ffi')
}
