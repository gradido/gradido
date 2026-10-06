# Shared native

This sub-module contains the Node-API bindings (`napi/`) for the gradido blockchain core logic, which is written in native C.
The reason is determinism across different platforms.

The C code itself is not vendored here. It comes in as zig packages pinned in `build.zig.zon`:

- [gradido-blockchain-core](https://github.com/gradido/gradido-blockchain-core) – GradidoUnit arithmetic, decay, signing, transaction types
- [arnm](https://github.com/gradido/arnm) – arena allocator, timer, duration and hex/uuid conversions. Must stay the version blockchain core builds against.

The build is driven by [c-cpp-zig-build](https://github.com/gradido/c_cpp_zig_build): it downloads the zig toolchain into
`~/.zig-build` (the Node-API headers come with it as an npm package), copies its build template into `.zig-native/` and runs `zig build` with `build.zig`.
Zig build takes care of the toolchain, so no compiler has to be installed.

The one prebuild is [rust-image-ffi](https://github.com/gradido/rust-image-ffi), behind `reencodeImage`.
Zig fetches the object for the target it builds and checks it against the hash pinned in `build.zig.zon`.
Its release covers Linux (glibc and musl), macOS and Windows on x64 and arm64; on every other target
the module still builds and `reencodeImage` throws.

## Getting started

```bash
bun run build        # build/shared_native.node
bun run build:debug  # the same, unoptimized
bun run build:clean  # remove build/, .zig-cache/ and .zig-native/
bun run info         # what a build would use
bun run test
```

## Updating a dependency

Change the url in `build.zig.zon` and take the new hash from

```bash
bunx c-cpp-zig-build zig -- fetch <url>
```
