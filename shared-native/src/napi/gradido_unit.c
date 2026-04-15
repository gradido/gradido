#include <node_api.h>
#include "../c/unit.h"

napi_value CalculateDecay(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc != 2) {
        napi_throw_type_error(env, NULL, "Expected two arguments");
        return NULL;
    }
    
    int64_t amount;
    status = napi_get_value_bigint_int64(env, args[0], &amount, NULL);
    if (status != napi_ok) {
        napi_throw_type_error(env, NULL, "Expected first argument to be a bigint (int64)");
        return NULL;
    }
    int64_t duration;
    status = napi_get_value_bigint_int64(env, args[1], &duration, NULL);
    if (status != napi_ok) {
        napi_throw_type_error(env, NULL, "Expected second argument to be a bigint (int64)");
        return NULL;
    }
    grdd_unit result = grdd_unit_calculate_decay(amount, duration);
    
    napi_value resultValue;
    status = napi_create_bigint_int64(env, result, &resultValue);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to create return value");
        return NULL;
    }
    return resultValue;
}


napi_value GetDecayStartTime(napi_env env, napi_callback_info info) {
    double timestamp = ((double)get_decay_start_time()) / 1000.0;
    napi_value resultValue;
    napi_status status = napi_create_date(env, timestamp, &resultValue);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to create return value");
        return NULL;
    }
    return resultValue;
}

NAPI_MODULE_INIT() {
    napi_value calculateDecayFunction;
    napi_create_function(env, NULL, 0, CalculateDecay, NULL, &calculateDecayFunction);
    napi_set_named_property(env, exports, "calculateDecay", calculateDecayFunction);

    napi_value getDecayStartTimeFunction;
    napi_create_function(env, NULL, 0, GetDecayStartTime, NULL, &getDecayStartTimeFunction);
    napi_set_named_property(env, exports, "getDecayStartTime", getDecayStartTimeFunction);

    return exports;
}
