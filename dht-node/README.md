# DHT-Node

## Bun-Compatibility

### Crash on NAPI module using `uv_interface_addresses`

Bun crashes when a NAPI module tries to call `uv_interface_addresses`, a libuv function currently unsupported:

Bun is working hard to support all NAPI module calls

## Production Build
Package.json dependencies contain only node_modules which cannot be bundled because of native node modules or needed for run start script. They are manually picked from @hyperswarm/dht
dependencies. The versions should be updated, if @hyperswarm/dht is updated.
The goal is to get a really small footprint for the production image. It is also possible to use in bare_metal setup.

### Bare Metal minimal setup
For a minimal bare metal production setup, look into [Dockerfile](Dockerfile) in the production step.
