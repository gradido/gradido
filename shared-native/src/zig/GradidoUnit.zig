const std = @import("std");
const math = @import("std").math;
const grdd = @import("c.zig").grdd;

pub const GradidoUnit = struct {
    gradido_cent: i64,

    pub const Error = error{
        // expect precision in the range [0;4]
        UnexpectedPrecision,
        EndTimeBeforeStartTime,
    };

    const zero: @This() = .{ .gradido_cent = 0 };

    pub fn createFromGdd(gdd: f64) @This() {
        return .{ .gradido_cent = grdd.grdd_unit_from_decimal(gdd) };
    }

    pub fn createFromString(stringAmount: []const u8) !@This() {
        var result: i64 = 0;

        const success = grdd.grdd_unit_from_string(
            stringAmount.ptr,
            &result,
        );

        if (!success) {
            return error.InvalidFormat;
        }

        return .{
            .gradido_cent = result,
        };
    }

    pub fn createFromGradidoCent(gddCent: i64) @This() {
        return .{
            .gradido_cent = gddCent,
        };
    }

    pub fn toGdd(self: @This()) f64 {
        return grdd.grdd_unit_to_decimal(self.gradido_cent);
    }

    pub fn decay(self: @This(), duration: i64) @This() {
        return .{ .gradido_cent = grdd.grdd_unit_calculate_decay(self.gradido_cent, duration) };
    }
    pub fn decayed(self: *@This(), duration: i64) *@This() {
        self.gradido_cent = grdd.grdd_unit_calculate_decay(self.gradido_cent, duration);
        return self;
    }

    pub fn negate(self: *@This()) *@This() {
        self.gradido_cent = self.gradido_cent * -1;
        return self;
    }

    pub fn negated(self: @This()) @This() {
        return .{ .gradido_cent = self.gradido_cent * -1 };
    }

    pub fn plus(self: @This(), other: @This()) @This() {
        return .{ .gradido_cent = self.gradido_cent + other.gradido_cent };
    }

    pub fn add(self: *@This(), other: @This()) *@This() {
        self.gradido_cent += other.gradido_cent;
        return self;
    }

    pub fn minus(self: @This(), other: @This()) @This() {
        return .{ .gradido_cent = self.gradido_cent - other.gradido_cent };
    }

    pub fn sub(self: *@This(), other: @This()) *@This() {
        self.gradido_cent -= other.gradido_cent;
        return self;
    }

    pub fn equal(self: @This(), other: @This()) bool {
        return self.gradido_cent == other.gradido_cent;
    }

    pub fn eq(self: @This(), other: @This()) bool {
        return self.equal(other);
    }

    // ----------------------------------------

    pub fn notEqual(self: @This(), other: @This()) bool {
        return self.gradido_cent != other.gradido_cent;
    }

    pub fn ne(self: @This(), other: @This()) bool {
        return self.notEqual(other);
    }

    // ----------------------------------------

    pub fn greaterThan(self: @This(), other: @This()) bool {
        return self.gradido_cent > other.gradido_cent;
    }

    pub fn gt(self: @This(), other: @This()) bool {
        return self.greaterThan(other);
    }

    // ----------------------------------------

    pub fn lessThan(self: @This(), other: @This()) bool {
        return self.gradido_cent < other.gradido_cent;
    }

    pub fn lt(self: @This(), other: @This()) bool {
        return self.lessThan(other);
    }

    // ----------------------------------------

    pub fn greaterOrEqual(self: @This(), other: @This()) bool {
        return self.gradido_cent >= other.gradido_cent;
    }

    pub fn gte(self: @This(), other: @This()) bool {
        return self.greaterOrEqual(other);
    }

    // ----------------------------------------

    pub fn lessOrEqual(self: @This(), other: @This()) bool {
        return self.gradido_cent <= other.gradido_cent;
    }

    pub fn lte(self: @This(), other: @This()) bool {
        return self.lessOrEqual(other);
    }

    pub fn secondsBetween(startTimeSeconds: i64, endTimeSeconds: i64) !i64 {
        var result: i64 = 0;
        if (!grdd.grdd_unit_calculate_duration_seconds(startTimeSeconds, endTimeSeconds, &result)) {
            return Error.EndTimeBeforeStartTime;
        }
        return result;
    }
};
