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
        if (entry.kind == .file and std.mem.endsWith(u8, entry.path, ".c")) {
            const full_path = b.fmt("{s}/{s}", .{ dir_path, entry.path });
            lib.addCSourceFiles(.{
                .files = &[_][]const u8{full_path},
                .flags = &.{},
            });
        }
    }
}

const BuildTarget = struct {
    name: []const u8,
    src: []const []const u8,
    use_sodium: bool = false,
};

fn processBuildTargets(b: *std.Build, target: std.Build.ResolvedTarget, optimize: std.builtin.OptimizeMode, lib: *std.Build.Step.Compile, targets: []const BuildTarget, path: []const u8) void {
    const googletest_dep = b.lazyDependency("googletest", .{
        .target = target,
        .optimize = optimize,
    });
    const sodium_dep = b.lazyDependency("libsodium", .{
        .target = target,
        .optimize = optimize,
        .static = true,
        .shared = false,
    });

    for (targets) |tt| {
        const exe = b.addExecutable(.{
            .name = tt.name,
            .root_module = b.createModule(.{
                .target = target,
                .optimize = optimize,
            }),
        });

        exe.linkLibrary(lib);

        if (googletest_dep) |dep| {
            exe.linkLibrary(dep.artifact("gtest"));
            exe.linkLibrary(dep.artifact("gtest_main"));
        }
        if (tt.use_sodium) {
            exe.root_module.addCMacro("USE_SODIUM", "1");
            if (sodium_dep) |dep| {
                exe.linkLibrary(dep.artifact(if (target.result.os.tag == .windows) "libsodium-static" else "sodium"));
            }
        }

        exe.addIncludePath(b.path("include"));
        exe.addIncludePath(b.path("third_party"));

        for (tt.src) |src_file| {
            exe.addCSourceFiles(.{
                .files = &.{b.fmt("{s}/{s}", .{ path, src_file })},
            });
        }

        b.installArtifact(exe);
    }
}

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const enable_benchmarks = b.option(bool, "benchmarks", "Enable benchmarks") orelse false;
    const enable_tests = b.option(bool, "tests", "Enable tests") orelse false;
    const enable_sodium = b.option(bool, "sodium", "Enable sodium and crypto") orelse false;
    const enforce_shared = b.option(bool, "shared", "Make lib shared") orelse false;
    const flatten_out = b.option(bool, "flattenOut", "Put direct into output folder, without lib or bin folder") orelse false;

    const lib = b.addLibrary(.{
        .name = "gradido_blockchain_core",
        .linkage = if (enforce_shared) .dynamic else .static,
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
        }),
    });
    if (enable_sodium) {
        lib.root_module.addCMacro("USE_SODIUM", "1");
        if (b.lazyDependency("libsodium", .{
            .target = target,
            .optimize = optimize,
            .static = true,
            .shared = false,
        })) |dep| {
            lib.linkLibrary(dep.artifact(if (target.result.os.tag == .windows) "libsodium-static" else "sodium"));
        }
    }

    lib.linkLibC();

    lib.addIncludePath(b.path("include"));
    lib.addIncludePath(b.path("include/gradido_blockchain_core/data/proto/gradido"));
    lib.addIncludePath(b.path("third_party"));
    lib.addIncludePath(b.path("third_party/pbtools"));

    addDirSources(lib, b, "src");
    addDirSources(lib, b, "third_party");

    if (flatten_out) {               
        const bin_install_step = b.addInstallBinFile(lib.getEmittedBin(), b.fmt("../{s}", .{ lib.out_filename }));
        b.getInstallStep().dependOn(&bin_install_step.step);
        if (target.result.os.tag == .windows) {
            const lib_install_step = b.addInstallLibFile(lib.getEmittedImplib(), b.fmt("../{s}", .{ lib.out_lib_filename }));
            b.getInstallStep().dependOn(&lib_install_step.step);
        }
    } else {
        b.installArtifact(lib);
    }

    if (enable_benchmarks and enable_sodium) {
        const path = "benchmarks/src";
        const bench_targets = [_]BuildTarget{ .{ .name = "bench_numberToString", .src = &.{"bench_numberToString.c"}, .use_sodium = true }, .{ .name = "bench_crypto", .src = &.{"bench_crypto.c"}, .use_sodium = true } };
        processBuildTargets(b, target, optimize, lib, &bench_targets, path);
    }

    if (enable_tests) {
        const path = "tests/unit/src";
        var test_targets: std.ArrayList(BuildTarget) = .{};
        test_targets.appendSlice(b.allocator, &[_]BuildTarget{
            .{ .name = "test_converter", .src = &.{"test_converter.cpp"} },
            .{ .name = "test_duration", .src = &.{"test_duration.cpp"} },
            .{ .name = "test_memory", .src = &.{"test_memory.cpp"} },
            .{ .name = "test_unit", .src = &.{"test_unit.cpp"} },
        }) catch @panic("test targets array add failed");

        if (enable_sodium) {
            test_targets.appendSlice(b.allocator, &[_]BuildTarget{
                .{ .name = "test_crypto", .src = &.{ "test_crypto.cpp", "utils.cpp" }, .use_sodium = true },
                .{ .name = "test_pbtools", .src = &.{ "test_pbtools.cpp", "key_pairs.cpp" }, .use_sodium = true },
                .{ .name = "test_runtime", .src = &.{ "test_runtime.cpp", "key_pairs.cpp" }, .use_sodium = true },
            }) catch @panic("test targets array add failed");
        }
        processBuildTargets(b, target, optimize, lib, test_targets.items, path);
    }
}
