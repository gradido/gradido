const std = @import("std");
const czb = @import("c_cpp_zig_build");

/// The build.zig.zon dependency holding the prebuilt rust-image-ffi object for this target, or
/// null where its release has none: 32 bit x86 and arm.
fn rustImageFfiDependencyName(target: std.Build.ResolvedTarget) ?[]const u8 {
    const t = target.result;
    const is_x86_64 = switch (t.cpu.arch) {
        .x86_64 => true,
        .aarch64 => false,
        else => return null,
    };
    return switch (t.os.tag) {
        .linux => if (t.abi.isGnu())
            (if (is_x86_64) "rust_image_ffi_x86_64_linux_gnu" else "rust_image_ffi_aarch64_linux_gnu")
        else if (t.abi.isMusl())
            (if (is_x86_64) "rust_image_ffi_x86_64_linux_musl" else "rust_image_ffi_aarch64_linux_musl")
        else
            null,
        .macos => if (is_x86_64) "rust_image_ffi_x86_64_macos" else "rust_image_ffi_aarch64_macos",
        .windows => if (is_x86_64) "rust_image_ffi_x86_64_windows" else "rust_image_ffi_aarch64_windows",
        else => null,
    };
}

pub fn build(b: *std.Build) !void {
    // Compiles everything under napi/ and installs shared_native.node into the output
    // directory. See the c-cpp-zig-build README for the options.
    const addon = try czb.addNodeAddon(b, .{ .name = "shared_native" });

    // The crypto half of the core - signing, key derivation, the generic hash, base64 -
    // is compiled only when libsodium is there, and the headers hide the declarations
    // behind the same macro. Both sides have to agree, so the dependency is built with
    // sodium and the addon defines the macro for its own translation units.
    addon.addDefine("USE_SODIUM", "1");

    const core = addon.dependency("blockchain_core", .{ .sodium = true });
    // arnm carries what the core used to keep in utils/: the arena allocator, the
    // monotonic timer, the duration and hex/uuid conversions. It is a package of its
    // own, and the napi layer includes its headers directly.
    const arnm = addon.dependency("arnm", .{});

    // Fetched by zig and checked against the hash pinned in build.zig.zon. Null on a target
    // its release has no prebuild for: the module still builds and reencodeImage throws.
    const rust_image_ffi = if (rustImageFfiDependencyName(addon.target)) |dep_name|
        b.lazyDependency(dep_name, .{})
    else
        null;
    const os_tag = addon.target.result.os.tag;

    for (addon.compiles) |compile| {
        compile.linkLibrary(core.artifact("gradido_blockchain_core"));
        compile.addIncludePath(core.path("include"));
        // data/unit.h reaches for "r128/r128.h", which the core vendors rather than installs,
        // so a consumer of its public headers needs third_party/ on the search path as well.
        compile.addIncludePath(core.path("third_party"));
        compile.addIncludePath(arnm.path("include"));

        // What the object needs beside itself (NATIVE_LIBS.txt in the archive) is libc and an
        // unwinder, both linked already, on macOS iconv, and on Windows, where the archive holds
        // the staticlib, a few system libraries.
        if (rust_image_ffi) |dep| {
            if (os_tag == .windows) {
                compile.addObjectFile(dep.path("librust_image_ffi.a"));
                for ([_][]const u8{ "kernel32", "ntdll", "userenv", "ws2_32", "dbghelp" }) |system_lib| {
                    compile.linkSystemLibrary(system_lib);
                }
            } else {
                compile.addObjectFile(dep.path("rust_image_ffi.o"));
                if (os_tag == .macos) {
                    compile.linkSystemLibrary("iconv");
                }
            }
            compile.root_module.addIncludePath(dep.path(""));
            compile.root_module.addCMacro("HAVE_RUST_IMAGE_FFI", "1");
        }
    }
}
