const std = @import("std");

/// Recursively add .c files from a directory
fn addDirSources(
    lib: *std.Build.Step.Compile,
    b: *std.Build,
    dir_path: []const u8,
) void {
    var dir = std.fs.cwd().openDir(dir_path, .{ .iterate = true }) catch |err| {
        std.debug.panic("Failed to open directory '{s}': {s}", .{ dir_path, @errorName(err) });
    };
    defer dir.close();

    var walker = dir.walk(b.allocator) catch |err| {
        std.debug.panic("Failed to walk directory '{s}': {s}", .{ dir_path, @errorName(err) });
    };
    defer walker.deinit();

    while (walker.next() catch null) |entry| {
        if (entry.kind == .file and std.mem.endsWith(u8, entry.path, ".c") or std.mem.endsWith(u8, entry.path, ".cpp")) {
            const full_path = b.fmt("{s}/{s}", .{ dir_path, entry.path });
            lib.addCSourceFiles(.{
                .files = &[_][]const u8{full_path},
                .flags = &.{},
            });
        }
    }
}

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const napi_version = b.option([]const u8, "NAPI_VERSION", "Napi Version") orelse "8";
    const napi_include = b.option([]const u8, "NAPI_INCLUDE", "Path to Napi headers") orelse null;
    const node_include = b.option([]const u8, "NODE_INCLUDE", "Path to NodeJs headers") orelse null;
    const node_lib = b.option([]const u8, "NODE_LIB", "Path to Node.js library (node.lib)") orelse null;

    const core_lib = b.addLibrary(.{ .name = "gradido_blockchain_core", .linkage = .static, .root_module = b.createModule(.{
        .target = target,
        .optimize = optimize,
    }) });

    const sodium = b.lazyDependency("libsodium", .{
        .target = target,
        .optimize = optimize,
        .static = true,
        .shared = false,
    });

    core_lib.root_module.addCMacro("USE_SODIUM", "1");
    if (sodium) |dep| {
        core_lib.linkLibrary(dep.artifact(if (target.result.os.tag == .windows) "libsodium-static" else "sodium"));
    }

    core_lib.linkLibC();

    core_lib.addIncludePath(b.path("include"));
    core_lib.addIncludePath(b.path("include/gradido_blockchain_core/data/proto/gradido"));
    core_lib.addIncludePath(b.path("third_party"));
    core_lib.addIncludePath(b.path("third_party/pbtools"));

    addDirSources(core_lib, b, "src");
    addDirSources(core_lib, b, "third_party");

    // b.installArtifact(core_lib);

    // napi
    const napi_lib = b.addLibrary(.{ .name = "shared-native", .linkage = .dynamic, .root_module = b.createModule(.{
        .target = target,
        .optimize = optimize,
    }) });

    napi_lib.root_module.addCMacro("USE_SODIUM", "1");
    napi_lib.root_module.addCMacro("NAPI_VERSION", napi_version);
    if (sodium) |dep| {
      napi_lib.linkLibrary(dep.artifact(if (target.result.os.tag == .windows) "libsodium-static" else "sodium"));
    }
    napi_lib.linkLibrary(core_lib);
    napi_lib.linkLibC();
    napi_lib.linkLibCpp();

    napi_lib.addIncludePath(b.path("include"));
    napi_lib.addIncludePath(b.path("third_party"));

    //set node js and Napi header path
    if (napi_include) |path| {
        napi_lib.root_module.addSystemIncludePath(.{ .cwd_relative = path });
    }
    if (node_include) |path| {
        napi_lib.root_module.addSystemIncludePath(.{ .cwd_relative = path });
    }
    addDirSources(napi_lib, b, "bindings/napi");

    // link with node js on windows
    if (.windows == target.result.os.tag) {
        if (node_lib) |path| {
            napi_lib.root_module.lib_paths.append(b.allocator, .{ .cwd_relative = path }) catch @panic("error adding node js path");
        } else {
            std.debug.panic("Need node-lib path on Windows, please set -DNODE_LIB=<path>", .{});
        }
        napi_lib.root_module.linkSystemLibrary("node", .{});
    }

    const install_step = b.addInstallBinFile(
        napi_lib.getEmittedBin(),
        "../shared_native.node",
    );
    b.getInstallStep().dependOn(&install_step.step);
}
