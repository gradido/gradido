# Shared native

This sub-module contains code that is written in native C for gradido blockchain core logic.
The reason is determinism across different platforms.
It uses the zig build system to compile the code.
Zig build take care of toolchain for building.

The one prebuild is [rust-image-ffi](https://github.com/gradido/rust-image-ffi), behind `reencodeImage`.
Zig fetches the object for the target it builds and checks it against the hash pinned in `build.zig.zon`.
Its release covers Linux (glibc and musl), macOS and Windows on x64 and arm64; on every other target
the module still builds and `reencodeImage` throws.

## Getting started



   
