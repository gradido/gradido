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

const BuildContext = struct { b: *std.Build, target: std.Build.ResolvedTarget, optimize: std.builtin.OptimizeMode, core_lib: *std.Build.Step.Compile, googletest_dep: ?*std.Build.Dependency, sodium_dep: ?*std.Build.Dependency, singleOutputDir: bool };

const BuildTarget = struct {
    link_googletest: bool = false,
    link_sodium: bool = false,
    name: []const u8,
    srcs: []const []const u8,
};

fn processBuildTarget(context: *const BuildContext, build_target: BuildTarget, path: []const u8) void {
    const b = context.b;
    const exe = b.addExecutable(.{
        .name = build_target.name,
        .root_module = b.createModule(.{
            .target = context.target,
            .optimize = context.optimize,
        }),
    });

    exe.linkLibrary(context.core_lib);

    if (build_target.link_googletest) {
        if (context.googletest_dep) |dep| {
            exe.linkLibrary(dep.artifact("gtest"));
            exe.linkLibrary(dep.artifact("gtest_main"));
        }
    }
    if (build_target.link_sodium) {
        exe.root_module.addCMacro("USE_SODIUM", "1");
        if (context.sodium_dep) |dep| {
            exe.linkLibrary(dep.artifact(if (context.target.result.os.tag == .windows) "libsodium-static" else "sodium"));
        }
    }

    exe.addIncludePath(b.path("include"));
    exe.addIncludePath(b.path("third_party"));

    for (build_target.srcs) |src_file| {
        exe.addCSourceFiles(.{
            .files = &.{b.fmt("{s}/{s}", .{ path, src_file })},
        });
    }

    if (context.singleOutputDir) {
        const bin_install_step = b.addInstallBinFile(exe.getEmittedBin(), b.fmt("../{s}", .{exe.out_filename}));
        b.getInstallStep().dependOn(&bin_install_step.step);
    } else {
        b.installArtifact(exe);
    }
}

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Options
    const enable_benchmarks = b.option(bool, "benchmarks", "Enable benchmarks") orelse false;
    const enable_tests = b.option(bool, "tests", "Enable tests") orelse false;
    const enable_sodium = b.option(bool, "sodium", "Enable sodium and crypto") orelse false;
    const lib_shared = b.option(bool, "shared", "Make lib shared") orelse false;
    const singleOutputDir = b.option(bool, "singleOutputDir", "Put direct into output folder, without lib or bin folder") orelse false;

    const core_lib = b.addLibrary(.{ .name = "gradido_blockchain_core", .linkage = if (lib_shared) .dynamic else .static, .root_module = b.createModule(.{
        .target = target,
        .optimize = optimize,
    }) });

    const context: BuildContext = .{ .b = b, .target = target, .optimize = optimize, .core_lib = core_lib, .googletest_dep = b.lazyDependency("googletest", .{
        .target = target,
        .optimize = optimize,
    }), .sodium_dep = b.lazyDependency("libsodium", .{
        .target = target,
        .optimize = optimize,
        .static = true,
        .shared = false,
    }), .singleOutputDir = singleOutputDir };

    if (enable_sodium) {
        core_lib.root_module.addCMacro("USE_SODIUM", "1");
        if (context.sodium_dep) |dep| {
            core_lib.linkLibrary(dep.artifact(if (target.result.os.tag == .windows) "libsodium-static" else "sodium"));
        }
    }

    core_lib.linkLibC();

    core_lib.addIncludePath(b.path("include"));
    core_lib.addIncludePath(b.path("include/gradido_blockchain_core/data/proto/gradido"));
    core_lib.addIncludePath(b.path("third_party"));
    core_lib.addIncludePath(b.path("third_party/pbtools"));

    addDirSources(core_lib, b, "src");
    addDirSources(core_lib, b, "third_party");

    if (singleOutputDir) {
        const bin_install_step = b.addInstallBinFile(core_lib.getEmittedBin(), b.fmt("../{s}", .{core_lib.out_filename}));
        b.getInstallStep().dependOn(&bin_install_step.step);
        if (target.result.os.tag == .windows) {
            const lib_install_step = b.addInstallLibFile(core_lib.getEmittedImplib(), b.fmt("../{s}", .{core_lib.out_lib_filename}));
            b.getInstallStep().dependOn(&lib_install_step.step);
        }
    } else {
        b.installArtifact(core_lib);
    }

    if (enable_benchmarks and enable_sodium) {
        const path = "benchmarks/src";
        processBuildTarget(&context, .{
            .link_googletest = false,
            .link_sodium = true,
            .name = "bench_numberToString",
            .srcs = &.{"bench_numberToString.c"},
        }, path);
        processBuildTarget(&context, .{ .link_googletest = false, .link_sodium = true, .name = "bench_crypto", .srcs = &.{"bench_crypto.c"} }, path);
    }

    if (enable_tests) {
        const path = "tests/unit/src";
        processBuildTarget(&context, .{ .link_googletest = true, .link_sodium = false, .name = "test_converter", .srcs = &.{"test_converter.cpp"} }, path);
        processBuildTarget(&context, .{ .link_googletest = true, .link_sodium = false, .name = "test_duration", .srcs = &.{"test_duration.cpp"} }, path);
        processBuildTarget(&context, .{ .link_googletest = true, .link_sodium = false, .name = "test_memory", .srcs = &.{"test_memory.cpp"} }, path);
        processBuildTarget(&context, .{ .link_googletest = true, .link_sodium = false, .name = "test_unit", .srcs = &.{"test_unit.cpp"} }, path);
        if (enable_sodium) {
            processBuildTarget(&context, .{ .link_googletest = true, .link_sodium = true, .name = "test_crypto", .srcs = &.{ "test_crypto.cpp", "utils.cpp" } }, path);
            processBuildTarget(&context, .{ .link_googletest = true, .link_sodium = true, .name = "test_pbtools", .srcs = &.{ "test_pbtools.cpp", "key_pairs.cpp" } }, path);
            processBuildTarget(&context, .{ .link_googletest = true, .link_sodium = true, .name = "test_runtime", .srcs = &.{ "test_runtime.cpp", "key_pairs.cpp" } }, path);
        }
    }
}
