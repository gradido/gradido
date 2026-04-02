#include "GradidoUnit.h"
#include <string>

using std::string;

// Static member initialization
Napi::FunctionReference GradidoUnit::constructor;

Napi::Object GradidoUnit::Init(Napi::Env env, Napi::Object exports) 
{
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "GradidoUnit", {
        InstanceMethod("toString", &GradidoUnit::ToString),
        InstanceMethod("toNumber", &GradidoUnit::ToNumber),
        InstanceMethod("negate", &GradidoUnit::Negate),
        InstanceMethod("negated", &GradidoUnit::Negated),
        InstanceMethod("round", &GradidoUnit::Round),
        InstanceMethod("rounded", &GradidoUnit::Rounded),
        InstanceMethod("add", &GradidoUnit::Add),
        InstanceMethod("plus", &GradidoUnit::Plus),
        InstanceMethod("sub", &GradidoUnit::Sub),
        InstanceMethod("minus", &GradidoUnit::Minus),
        InstanceMethod("decay", &GradidoUnit::Decay),
        InstanceMethod("decayed", &GradidoUnit::Decayed),
        InstanceMethod("compoundInterest", &GradidoUnit::CompoundInterest),
        InstanceMethod("compoundInterested", &GradidoUnit::CompoundInterested),
        
        // Comparison methods
        InstanceMethod("equal", &GradidoUnit::Equal),
        InstanceMethod("eq", &GradidoUnit::Eq),
        InstanceMethod("notEqual", &GradidoUnit::NotEqual),
        InstanceMethod("ne", &GradidoUnit::Ne),
        InstanceMethod("greaterThan", &GradidoUnit::GreaterThan),
        InstanceMethod("gt", &GradidoUnit::Gt),
        InstanceMethod("lessThan", &GradidoUnit::LessThan),
        InstanceMethod("lt", &GradidoUnit::Lt),
        InstanceMethod("greaterOrEqual", &GradidoUnit::GreaterOrEqual),
        InstanceMethod("gte", &GradidoUnit::Gte),
        InstanceMethod("lessOrEqual", &GradidoUnit::LessOrEqual),
        InstanceMethod("lte", &GradidoUnit::Lte),
        
        StaticMethod("effectiveDecayDuration", &GradidoUnit::EffectiveDecayDuration),
        StaticMethod("getDecayStartTime", &GradidoUnit::GetDecayStartTime),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("GradidoUnit", func);
    return exports;
}

GradidoUnit::GradidoUnit(const Napi::CallbackInfo& info) : Napi::ObjectWrap<GradidoUnit>(info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() > 1) {
        Napi::TypeError::New(env, "Invalid GradidoUnit constructor arguments, expect 0 | 1 arguments")
            .ThrowAsJavaScriptException();
        return;
    }

    if (info.Length() == 0) {
        mValue = 0;
    } else {
        Napi::Value arg = info[0];
        
        if (arg.IsNumber()) {
            double gdd = arg.As<Napi::Number>().DoubleValue();
            mValue = grdd_unit_from_decimal(gdd);
        } else if (arg.IsString()) {
            std::string str = arg.As<Napi::String>().Utf8Value();
            if (!grdd_unit_from_string(str.c_str(), &mValue)) {
                Napi::TypeError::New(env, "Invalid GradidoUnit string")
                    .ThrowAsJavaScriptException();
                return;
            }
        } else {
            Napi::TypeError::New(env, "Invalid GradidoUnit constructor arguments, expect input?: number|string")
                .ThrowAsJavaScriptException();
            return;
        }
    }
}

GradidoUnit::~GradidoUnit() 
{
    // Destructor - no manual cleanup needed for primitive types
}

Napi::Value GradidoUnit::CreateNewInstance(grdd_unit newValue) const 
{
    Napi::Env env = Env();
    Napi::HandleScope scope(env);
    
    Napi::Object new_obj = constructor.New({});
    GradidoUnit* new_instance = Napi::ObjectWrap<GradidoUnit>::Unwrap(new_obj);
    new_instance->mValue = newValue;
    
    return new_obj;
}

Napi::Value GradidoUnit::ToString(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    uint32_t precision = 4;
    if (info.Length() >= 1 && info[0].IsNumber()) {
        precision = info[0].As<Napi::Number>().Uint32Value();
    }

    char buffer[32];
    memset(buffer, 0, sizeof(buffer));
    int err = grdd_unit_to_string(mValue, buffer, sizeof(buffer), precision);
    if (err != 0) {
        Napi::Error::New(env, "toString failed").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::String::New(env, buffer);
}

Napi::Value GradidoUnit::ToNumber(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    return Napi::Number::New(env, grdd_unit_to_decimal(mValue));
}

Napi::Value GradidoUnit::Negate(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    mValue = grdd_unit_negated(mValue);
    return info.This();
}

Napi::Value GradidoUnit::Negated(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    return CreateNewInstance(grdd_unit_negated(mValue));
}

Napi::Value GradidoUnit::Round(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    uint32_t precision = 2;
    if (info.Length() >= 1 && info[0].IsNumber()) {
        precision = info[0].As<Napi::Number>().Uint32Value();
    }

    auto rounded = roundToPrecision(static_cast<double>(mValue) / 10000.0, precision) * 10000.0;
    mValue = static_cast<grdd_unit>(rounded);
    return info.This();
}

Napi::Value GradidoUnit::Rounded(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    uint32_t precision = 2;
    if (info.Length() >= 1 && info[0].IsNumber()) {
        precision = info[0].As<Napi::Number>().Uint32Value();
    }
    
    auto rounded = roundToPrecision(static_cast<double>(mValue) / 10000.0, precision) * 10000.0;
    return CreateNewInstance(static_cast<grdd_unit>(rounded));
}

Napi::Value GradidoUnit::Add(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    GradidoUnit* other = Napi::ObjectWrap<GradidoUnit>::Unwrap(info[0].As<Napi::Object>());
    if (!other) {
        Napi::TypeError::New(env, "Expected GradidoUnit instance").ThrowAsJavaScriptException();
        return env.Null();
    }

    mValue += other->mValue;
    return info.This();
}

Napi::Value GradidoUnit::Plus(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    GradidoUnit* other = Napi::ObjectWrap<GradidoUnit>::Unwrap(info[0].As<Napi::Object>());
    if (!other) {
        Napi::TypeError::New(env, "Expected GradidoUnit instance").ThrowAsJavaScriptException();
        return env.Null();
    }

    return CreateNewInstance(mValue + other->mValue);
}

Napi::Value GradidoUnit::Sub(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    GradidoUnit* other = Napi::ObjectWrap<GradidoUnit>::Unwrap(info[0].As<Napi::Object>());
    if (!other) {
        Napi::TypeError::New(env, "Expected GradidoUnit instance").ThrowAsJavaScriptException();
        return env.Null();
    }

    mValue -= other->mValue;
    return info.This();
}

Napi::Value GradidoUnit::Minus(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    GradidoUnit* other = Napi::ObjectWrap<GradidoUnit>::Unwrap(info[0].As<Napi::Object>());
    if (!other) {
        Napi::TypeError::New(env, "Expected GradidoUnit instance").ThrowAsJavaScriptException();
        return env.Null();
    }

    return CreateNewInstance(mValue - other->mValue);
}

Napi::Value GradidoUnit::Decay(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected number for duration in seconds").ThrowAsJavaScriptException();
        return env.Null();
    }

    int64_t duration = info[0].As<Napi::Number>().Int64Value();
    mValue = grdd_unit_calculate_decay(mValue, duration);
    
    return info.This();
}

Napi::Value GradidoUnit::Decayed(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected number for duration in seconds").ThrowAsJavaScriptException();
        return env.Null();
    }

    int64_t duration = info[0].As<Napi::Number>().Int64Value();
    return CreateNewInstance(grdd_unit_calculate_decay(mValue, duration));
}

Napi::Value GradidoUnit::CompoundInterest(const Napi::CallbackInfo& info)   
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected number for duration in seconds").ThrowAsJavaScriptException();
        return env.Null();
    }

    int64_t duration = info[0].As<Napi::Number>().Int64Value();
    mValue = grdd_unit_calculate_decay(mValue, -duration);
    
    return info.This();
}

Napi::Value GradidoUnit::CompoundInterested(const Napi::CallbackInfo& info)   
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected number for duration in seconds").ThrowAsJavaScriptException();
        return env.Null();
    }

    int64_t duration = info[0].As<Napi::Number>().Int64Value();
    return CreateNewInstance(grdd_unit_calculate_decay(mValue, -duration));
}

Napi::Value GradidoUnit::EffectiveDecayDuration(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 2) {
        Napi::TypeError::New(env, "Expected 2 arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsDate()) {
        Napi::TypeError::New(env, "Expected Date for start timestamp").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[1].IsDate()) {
        Napi::TypeError::New(env, "Expected Date for end timestamp").ThrowAsJavaScriptException();
        return env.Null();
    }

    double start_ms = info[0].As<Napi::Date>().ValueOf();
    double end_ms = info[1].As<Napi::Date>().ValueOf();

    grdd_timestamp_seconds start = static_cast<grdd_timestamp_seconds>(start_ms / 1000.0);
    grdd_timestamp_seconds end = static_cast<grdd_timestamp_seconds>(end_ms / 1000.0);

    grdd_duration_seconds duration;
    if (!grdd_unit_calculate_duration_seconds(start, end, &duration)) {
        Napi::RangeError::New(env, "End date must be after start date").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::Number::New(env, static_cast<double>(duration));
}

Napi::Value GradidoUnit::GetDecayStartTime(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
    
    grdd_timestamp_seconds start = get_decay_start_time();
    return Napi::Date::New(env, static_cast<double>(start) * 1000.0);
}

// Comparison method implementations
Napi::Value GradidoUnit::Equal(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    GradidoUnit* other = Napi::ObjectWrap<GradidoUnit>::Unwrap(info[0].As<Napi::Object>());
    if (!other) {
        Napi::TypeError::New(env, "Expected GradidoUnit instance").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::Boolean::New(env, mValue == other->mValue);
}

Napi::Value GradidoUnit::NotEqual(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    GradidoUnit* other = Napi::ObjectWrap<GradidoUnit>::Unwrap(info[0].As<Napi::Object>());
    if (!other) {
        Napi::TypeError::New(env, "Expected GradidoUnit instance").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::Boolean::New(env, mValue != other->mValue);
}

Napi::Value GradidoUnit::GreaterThan(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    GradidoUnit* other = Napi::ObjectWrap<GradidoUnit>::Unwrap(info[0].As<Napi::Object>());
    if (!other) {
        Napi::TypeError::New(env, "Expected GradidoUnit instance").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::Boolean::New(env, mValue > other->mValue);
}

Napi::Value GradidoUnit::LessThan(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    GradidoUnit* other = Napi::ObjectWrap<GradidoUnit>::Unwrap(info[0].As<Napi::Object>());
    if (!other) {
        Napi::TypeError::New(env, "Expected GradidoUnit instance").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::Boolean::New(env, mValue < other->mValue);
}

Napi::Value GradidoUnit::GreaterOrEqual(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    GradidoUnit* other = Napi::ObjectWrap<GradidoUnit>::Unwrap(info[0].As<Napi::Object>());
    if (!other) {
        Napi::TypeError::New(env, "Expected GradidoUnit instance").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::Boolean::New(env, mValue >= other->mValue);
}

Napi::Value GradidoUnit::LessOrEqual(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Expected 1 argument").ThrowAsJavaScriptException();
        return env.Null();
    }

    GradidoUnit* other = Napi::ObjectWrap<GradidoUnit>::Unwrap(info[0].As<Napi::Object>());
    if (!other) {
        Napi::TypeError::New(env, "Expected GradidoUnit instance").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::Boolean::New(env, mValue <= other->mValue);
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) 
{
    return GradidoUnit::Init(env, exports);
}

NODE_API_MODULE(GradidoUnit, Init)
