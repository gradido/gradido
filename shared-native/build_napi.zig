const std = @import("std");
const zcc = @import("compile_commands");

fn dlltoolMachine(target: std.Build.ResolvedTarget) []const u8 {
    return switch (target.result.cpu.arch) {
        .x86_64 => "i386:x86-64",
        .x86 => "i386",
        .aarch64 => "arm64",
        else => @panic("unsupported windows arch for dlltool"),
    };
}

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

fn buildNodeApiLib(b: *std.Build, target: std.Build.ResolvedTarget, node_def: []const u8, binary_name: []const u8) std.Build.LazyPath {
    const dlltool = b.addSystemCommand(&.{ b.graph.zig_exe, "dlltool" });
    dlltool.addArgs(&.{ "-m", dlltoolMachine(target), "-D", binary_name });
    dlltool.addArg("-d");
    dlltool.addFileArg(.{ .cwd_relative = node_def });
    dlltool.addArg("-l");
    const node_api_lib = dlltool.addOutputFileArg("node_api.lib");
    return node_api_lib;
}

const LibPrepareContext = struct { b: *std.Build, target: std.Build.ResolvedTarget, optimize: std.builtin.OptimizeMode, sodium: ?*std.Build.Dependency, napi_disable_cpp_exceptions: bool, node_addon_api_enable_maybe: bool, napi_include: ?[]const u8, napi_version: []const u8, node_include: ?[]const u8, r_path: ?[]const u8 };

pub fn prepareLib(name: []const u8, context: *const LibPrepareContext) *std.Build.Step.Compile {
    const b = context.b;

    const lib = b.addLibrary(.{ .name = name, .linkage = .dynamic, .root_module = b.createModule(.{
        .target = context.target,
        .optimize = context.optimize,
    }) });

    lib.root_module.addCMacro("USE_SODIUM", "1");
    if (context.sodium) |dep| {
        lib.linkLibrary(dep.artifact(if (context.target.result.os.tag == .windows) "libsodium-static" else "sodium"));
    }

    lib.linkLibC();
    lib.linkLibCpp();

    lib.addIncludePath(b.path("include"));
    lib.addIncludePath(b.path("include/gradido_blockchain_core/data/proto/gradido"));
    lib.addIncludePath(b.path("third_party"));
    lib.addIncludePath(b.path("third_party/pbtools"));

    addDirSources(lib, b, "src");
    addDirSources(lib, b, "third_party");

    lib.root_module.addCMacro("NAPI_VERSION", context.napi_version);
    if (context.napi_disable_cpp_exceptions) {
        lib.root_module.addCMacro("NAPI_DISABLE_CPP_EXCEPTIONS", "1");
    }
    if (context.node_addon_api_enable_maybe) {
        lib.root_module.addCMacro("NODE_ADDON_API_ENABLE_MAYBE", "1");
    }

    // set node js and Napi header path
    if (context.napi_include) |path| {
        lib.root_module.addSystemIncludePath(.{ .cwd_relative = path });
    }
    if (context.node_include) |path| {
        lib.root_module.addSystemIncludePath(.{ .cwd_relative = path });
    }
    if (context.r_path) |path| {
        lib.root_module.addRPath(.{ .cwd_relative = path });
    }
    addDirSources(lib, b, "napi");
    return lib;
}

fn buildCompileCommands(lib: *std.Build.Step.Compile, b: *std.Build) void {
    // make compile_commands
    var cdbTargets: std.ArrayList(*std.Build.Step.Compile) = .empty;
    cdbTargets.append(b.allocator, lib) catch @panic("OOM");

    const cdbTargetsSlice = cdbTargets.toOwnedSlice(b.allocator) catch @panic("OOM");
    const build_cdb_step = zcc.createStep(b, "cdb", cdbTargetsSlice);

    build_cdb_step.dependOn(&lib.step);
    b.getInstallStep().dependOn(build_cdb_step);
}

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const is_windows = target.result.os.tag == .windows;
    const optimize = b.standardOptimizeOption(.{});
    const context: LibPrepareContext = .{ .b = b, .target = target, .optimize = optimize, .sodium = b.lazyDependency("libsodium", .{
        .target = target,
        .optimize = optimize,
        .static = true,
        .shared = false,
    }),
    .napi_disable_cpp_exceptions = b.option(bool, "NAPI_DISABLE_CPP_EXCEPTIONS", "Disable napi cpp exceptions") orelse false,
    .node_addon_api_enable_maybe = b.option(bool, "NODE_ADDON_API_ENABLE_MAYBE", "For alternative Exception handling wit disabled cpp exceptions") orelse false,
    .napi_include = b.option([]const u8, "napi-headers", "Path to Napi headers") orelse null,
    .napi_version = b.option([]const u8, "NAPI_VERSION", "Napi Version") orelse "8",
    .node_include = b.option([]const u8, "node-headers", "Path to NodeJs headers") orelse null,
    .r_path = b.option([]const u8, "rpath", "rpath for dynamic libraries") orelse null
    };

    // link with node js and/or bun on windows
    if (is_windows) {
        const node_def = b.option([]const u8, "node-api-def", "Path to NodeJs def") orelse @panic("node-api-def is required on Windows. Please provide -Dnode-api-def=<path>");
        const node_exe = b.findProgram(&.{"node.exe"}, &.{}) catch null;
        const bun_exe = b.findProgram(&.{"bun.exe"}, &.{}) catch null;
        var compile_commands_builded = false;
        if (node_exe != null) {
            std.debug.print("Building Nodejs Native Module\n", .{});
            const lib = prepareLib("shared-native", &context);
            buildCompileCommands(lib, b);
            compile_commands_builded = true;
            const node_api_lib = buildNodeApiLib(b, target, node_def, "node.exe");
            lib.addObjectFile(node_api_lib);
            const install_step = b.addInstallBinFile(
                lib.getEmittedBin(),
                "../shared_native.node",
            );
            b.getInstallStep().dependOn(&install_step.step);
        }
        if (bun_exe != null) {
            std.debug.print("Building Bun Native Module\n", .{});
            const lib = prepareLib("shared-native-bun", &context);
            if (!compile_commands_builded) {
                buildCompileCommands(lib, b);
            }
            const bun_api_lib = buildNodeApiLib(b, target, node_def, "bun.exe");
            lib.addObjectFile(bun_api_lib);
            const install_step = b.addInstallBinFile(
                lib.getEmittedBin(),
                "../shared_native.bun.node",
            );
            b.getInstallStep().dependOn(&install_step.step);
        }
        if (node_exe == null and bun_exe == null) {
            @panic("Neither node.exe nor bun.exe found – cannot build native module on windows");
        }
    } else {
        const lib = prepareLib("shared-native", &context);
        buildCompileCommands(lib, b);
        const install_step = b.addInstallBinFile(
            lib.getEmittedBin(),
            "../shared_native.node",
        );
        b.getInstallStep().dependOn(&install_step.step);
    }
}
