#include <node_api.h>
#include "../c/unit.h"

static bool get_bigint_value(napi_env env, napi_value value, int64_t* result) {
  bool lossless;
  napi_status status = napi_get_value_bigint_int64(env, value, result, &lossless);
  return (status == napi_ok && lossless);
}

napi_value grdnjs_calculate_decay(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t argc = 2;
  napi_value args[2];
  status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to parse arguments");
    return NULL;
  }

  if (argc != 2) {
    napi_throw_error(env, NULL, "Expected two arguments");
    return NULL;
  }

  grdd_unit unit;
  if (!get_bigint_value(env, args[0], &unit)) {
    napi_throw_type_error(env, NULL, "Expected first argument to be a bigint (int64)");
    return NULL;
  }

  grdd_duration_seconds duration;
  if (!get_bigint_value(env, args[1], &duration)) {
    napi_throw_type_error(env, NULL, "Expected second argument to be a bigint (int64)");
    return NULL;
  }

  grdd_unit result = grdd_unit_calculate_decay(unit, duration);

  napi_value resultValue;
  status = napi_create_bigint_int64(env, result, &resultValue);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to create bigint");
    return NULL;
  }

  return resultValue;
}


napi_value grdnjs_get_decay_start_time(napi_env env, napi_callback_info info) {
  napi_status status;

  grdd_timestamp_seconds start_time = grdd_unit_decay_start_time();

  napi_value resultValue;
  status = napi_create_date(env, start_time * 1000, &resultValue);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to create Date");
    return NULL;
  }

  return resultValue;
}

// register functions with nodejs

// helper
typedef struct {
  const char* name;
  napi_callback callback;
} grdj_func;

static napi_status register_function(napi_env env, napi_value exports, grdj_func* func_info) {
  napi_status status;
  napi_value func;
  status = napi_create_function(env, func_info->name, NAPI_AUTO_LENGTH, func_info->callback, NULL, &func);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to create function");
    return status;
  }
  
  status = napi_set_named_property(env, exports, func_info->name, func);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to set function property");
    return status;
  }
  
  return napi_ok;
}


napi_value Init(napi_env env, napi_value exports) {
  grdj_func functions[] = {
    {"calculateDecay", grdnjs_calculate_decay},
    {"getDecayStartTime", grdnjs_get_decay_start_time},
  };
  
  for (size_t i = 0; i < sizeof(functions) / sizeof(functions[0]); i++) {
    napi_status status = register_function(env, exports, &functions[i]);
    if (status != napi_ok) {
      napi_throw_error(env, NULL, "Failed to create function");
      return NULL;
    }
  }
  
  return exports;
}

NAPI_MODULE(GradidoUnit, Init)
