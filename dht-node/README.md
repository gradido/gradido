# DHT-Node

## Bun-Compatibility

### Crash on NAPI module using `uv_interface_addresses`

Bun crashes when a NAPI module tries to call `uv_interface_addresses`, a libuv function currently unsupported:

Bun is working hard to support all NAPI module calls
