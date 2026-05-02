const isBun = typeof process !== 'undefined' && 'bun' in process.versions

if (!isBun) {
  module.exports = require('./build/shared_native.node')
} else {
  // bun cannot handle NodeJs Native Addons build with mingw32 or clang (zig as c compiler)
  // on windows (at the moment), so we use direct ffi instead
  // direct ffi with bun should be also faster as using NAPI so we use it also on other platforms
  module.exports = require('./bindings/bun/gradidoUnit')
}
