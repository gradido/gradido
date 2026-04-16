const isBun = typeof process !== 'undefined' && 'bun' in process.versions

if (!isBun) {
  module.exports = require('./build/shared_native.node')
} else {
  // bun cannot handle NodeJs Native Addons build with mingw32 on windows (at the moment), so we use direct ffi instead
  module.exports = require('./src/napi/gradido_unit_bun_ffi')
}
