#include <node_api.h>
#include <string.h>
#include <stdlib.h>
#include "../c/unit.h"

typedef struct {
    grdd_unit value;
} gradido_unit_wrapper;

napi_ref constructor_ref;

// ---------- Helper ----------

static gradido_unit_wrapper* load_gradido_unit_from_value(napi_env env, napi_value obj) 
{  
    napi_value constructor;
    napi_get_reference_value(env, constructor_ref, &constructor);

    bool is_instance;
    napi_instanceof(env, obj, constructor, &is_instance);

    if (!is_instance) {
        napi_throw_type_error(env, NULL, "Expected GradidoUnit instance");
        return NULL;
    }
    
    gradido_unit_wrapper* self;
    napi_status result = napi_unwrap(env, obj, (void**)&self);
    if (result != napi_ok) {
        napi_throw_type_error(env, NULL, "Invalid GradidoUnit instance");
        return NULL;
    }
    return self;
}

static napi_value create_gradido_unit_instance(napi_env env, grdd_unit value) {
    napi_value constructor;
    napi_get_reference_value(env, constructor_ref, &constructor);

    napi_value new_obj;
    napi_new_instance(env, constructor, 0, NULL, &new_obj);

    gradido_unit_wrapper* new_wrapper;
    if (napi_unwrap(env, new_obj, (void**)&new_wrapper) != napi_ok) {
        napi_throw_type_error(env, NULL, "Couldn't create new GradidoUnit instance");
        return NULL;
    }
    new_wrapper->value = value;
    return new_obj;
}

// ---------- Constructor ----------

void gradido_unit_finalize(napi_env env, void* finalize_data, void* finalize_hint) {
    gradido_unit_wrapper* wrapper = (gradido_unit_wrapper*)finalize_data;
    free(wrapper);
}

napi_value GradidoUnit_constructor(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc > 1) {
      napi_throw_type_error(env, NULL, "Invalid GradidoUnit constructor arguments, expect 0 | 1 arguments");
      return NULL;
    }
    napi_valuetype type;
    if (argc == 1) {
      napi_typeof(env, args[0], &type);
      if (type != napi_number && type != napi_string) {
        napi_throw_type_error(env, NULL, "Invalid GradidoUnit constructor arguments, expect input?: number|string");
        return NULL;
      }
    }
    gradido_unit_wrapper* wrapper = (gradido_unit_wrapper*)malloc(sizeof(gradido_unit_wrapper));  
    
    if (argc == 0) {
      wrapper->value = 0;    
    }
    else if (argc == 1) 
    {
        if (type == napi_number) {
            double gdd;
            napi_get_value_double(env, args[0], &gdd);
            wrapper->value = grdd_unit_from_decimal(gdd);
        } else if (type == napi_string) {
            size_t len;
            napi_get_value_string_utf8(env, args[0], NULL, 0, &len);

            char* buffer = (char*)malloc(len + 1);
            napi_get_value_string_utf8(env, args[0], buffer, len + 1, &len);

            if (!grdd_unit_from_string(buffer, &wrapper->value)) {
                napi_throw_type_error(env, NULL, "Invalid GradidoUnit string");
            }

            free(buffer);
        }
    }
    
    napi_wrap(env, this_arg, wrapper, gradido_unit_finalize, NULL, NULL);
    return this_arg;
}

// ---------- toString ----------

napi_value GradidoUnit_toString(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    gradido_unit_wrapper* wrapper = load_gradido_unit_from_value(env, this_arg);
    if (!wrapper) {
        return NULL;
    }
    
    uint32_t precision = 4;
    if (argc >= 1) {
        napi_get_value_uint32(env, args[0], &precision);
    }

    char buffer[32];
    memset(buffer, 0, sizeof(buffer));
    int err = grdd_unit_to_string(wrapper->value, buffer, sizeof(buffer), precision);
    if (err != 0) {
        napi_throw_error(env, NULL, "toString failed");
        return NULL;
    }

    napi_value result;
    napi_create_string_utf8(env, buffer, NAPI_AUTO_LENGTH, &result);
    return result;
}

// ---------- negate ----------

napi_value GradidoUnit_negate(napi_env env, napi_callback_info info) {
    napi_value this_arg;
    napi_get_cb_info(env, info, NULL, NULL, &this_arg, NULL);

    gradido_unit_wrapper* wrapper = load_gradido_unit_from_value(env, this_arg);
    if (!wrapper) {
        return NULL;
    }

    wrapper->value = grdd_unit_negated(wrapper->value);
    return this_arg;
}

// ---------- add/sub ----------

napi_value GradidoUnit_add(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    gradido_unit_wrapper* other = load_gradido_unit_from_value(env, args[0]);
    if (!self || !other) {
        return NULL;
    }
    self->value += other->value;
    return this_arg;
}

napi_value GradidoUnit_sub(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    gradido_unit_wrapper* other = load_gradido_unit_from_value(env, args[0]);
    if (!self || !other) {
        return NULL;
    }

    self->value -= other->value;
    return this_arg;
}

// ---------- negated ----------

napi_value GradidoUnit_negated(napi_env env, napi_callback_info info) {
    napi_value this_arg;

    napi_get_cb_info(env, info, NULL, NULL, &this_arg, NULL);
    
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    if (!self) {
        return NULL;
    }

    grdd_unit result = -self->value;
    return create_gradido_unit_instance(env, result);
}

// ---------- plus ----------

napi_value GradidoUnit_plus(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    gradido_unit_wrapper* other = load_gradido_unit_from_value(env, args[0]);
    if (!self || !other) {
        return NULL;
    }

    grdd_unit result = self->value + other->value;
    return create_gradido_unit_instance(env, result);
}

// ---------- minus ----------

napi_value GradidoUnit_minus(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    gradido_unit_wrapper* other = load_gradido_unit_from_value(env, args[0]);
    if (!self || !other) {
        return NULL;
    }

    grdd_unit result = self->value - other->value;
    return create_gradido_unit_instance(env, result);
}

// ---------- decay ----------

napi_value GradidoUnit_decay(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* wrapper = load_gradido_unit_from_value(env, this_arg);
    if (!wrapper) {
        return NULL;
    }

    int64_t duration;
    if (napi_get_value_int64(env, args[0], &duration) != napi_ok) {
        napi_throw_type_error(env, NULL, "Expected number for duration in seconds");
        return NULL;
    }

    wrapper->value = grdd_unit_calculate_decay(wrapper->value, duration);
    return this_arg;
}

// ---------- decayed ----------

napi_value GradidoUnit_decayed(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    if (!self) {
        return NULL;
    }

    int64_t duration;
    if (napi_get_value_int64(env, args[0], &duration) != napi_ok) {
        napi_throw_type_error(env, NULL, "Expected number for duration in seconds");
        return NULL;
    }

    grdd_unit result = grdd_unit_calculate_decay(self->value, duration);
    return create_gradido_unit_instance(env, result);
}

// identical to calculateDecay, but with negative duration
napi_value GradidoUnit_compoundInterest(napi_env env, napi_callback_info info) {
  size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* wrapper = load_gradido_unit_from_value(env, this_arg);
    if (!wrapper) {
        return NULL;
    }

    int64_t duration;
    if (napi_get_value_int64(env, args[0], &duration) != napi_ok) {
        napi_throw_type_error(env, NULL, "Expected number for duration in seconds");
        return NULL;
    }
    wrapper->value = grdd_unit_calculate_decay(wrapper->value, -duration);
    return this_arg;
}

// ---------- comparison functions ----------

napi_value GradidoUnit_equal(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    gradido_unit_wrapper* other = load_gradido_unit_from_value(env, args[0]);
    if (!self || !other) {
        return NULL;
    }

    napi_value result;
    napi_get_boolean(env, self->value == other->value, &result);
    return result;
}

napi_value GradidoUnit_eq(napi_env env, napi_callback_info info) {
    return GradidoUnit_equal(env, info);
}

napi_value GradidoUnit_notEqual(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    gradido_unit_wrapper* other = load_gradido_unit_from_value(env, args[0]);
    if (!self || !other) {
        return NULL;
    }

    napi_value result;
    napi_get_boolean(env, self->value != other->value, &result);
    return result;
}

napi_value GradidoUnit_ne(napi_env env, napi_callback_info info) {
    return GradidoUnit_notEqual(env, info);
}

napi_value GradidoUnit_greaterThan(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    gradido_unit_wrapper* other = load_gradido_unit_from_value(env, args[0]);
    if (!self || !other) {
        return NULL;
    }

    napi_value result;
    napi_get_boolean(env, self->value > other->value, &result);
    return result;
}

napi_value GradidoUnit_gt(napi_env env, napi_callback_info info) {
    return GradidoUnit_greaterThan(env, info);
}

napi_value GradidoUnit_lessThan(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    gradido_unit_wrapper* other = load_gradido_unit_from_value(env, args[0]);
    if (!self || !other) {
        return NULL;
    }

    napi_value result;
    napi_get_boolean(env, self->value < other->value, &result);
    return result;
}

napi_value GradidoUnit_lt(napi_env env, napi_callback_info info) {
    return GradidoUnit_lessThan(env, info);
}

napi_value GradidoUnit_greaterOrEqual(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    gradido_unit_wrapper* other = load_gradido_unit_from_value(env, args[0]);
    if (!self || !other) {
        return NULL;
    }

    napi_value result;
    napi_get_boolean(env, self->value >= other->value, &result);
    return result;
}

napi_value GradidoUnit_gte(napi_env env, napi_callback_info info) {
    return GradidoUnit_greaterOrEqual(env, info);
}

napi_value GradidoUnit_lessOrEqual(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value this_arg;

    napi_get_cb_info(env, info, &argc, args, &this_arg, NULL);
    if (argc != 1) {
        napi_throw_type_error(env, NULL, "Expected 1 argument");
        return NULL;
    }
    
    gradido_unit_wrapper* self = load_gradido_unit_from_value(env, this_arg);
    gradido_unit_wrapper* other = load_gradido_unit_from_value(env, args[0]);
    if (!self || !other) {
        return NULL;
    }

    napi_value result;
    napi_get_boolean(env, self->value <= other->value, &result);
    return result;
}

napi_value GradidoUnit_lte(napi_env env, napi_callback_info info) {
    return GradidoUnit_lessOrEqual(env, info);
}

// ---------- static: duration ----------

napi_value GradidoUnit_secondsBetween(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];

    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (argc != 2) {
        napi_throw_type_error(env, NULL, "Expected 2 arguments");
        return NULL;
    }
    
    double start_ms, end_ms;
    if (napi_get_date_value(env, args[0], &start_ms) != napi_ok) {
        napi_throw_type_error(env, NULL, "Expected Date for start timestamp");
        return NULL;
    }
    if (napi_get_date_value(env, args[1], &end_ms) != napi_ok) {
        napi_throw_type_error(env, NULL, "Expected Date for end timestamp");
        return NULL;
    }

    grdd_timestamp_seconds start = (int64_t)(start_ms / 1000.0);
    grdd_timestamp_seconds end   = (int64_t)(end_ms / 1000.0);

    grdd_duration_seconds duration;
    if (!grdd_unit_calculate_duration_seconds(start, end, &duration)) {
        napi_throw_range_error(env, NULL, "start > end");
        return NULL;
    }

    napi_value result;
    napi_create_int64(env, duration, &result);
    return result;
}

// ---------- Init ----------

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor props[] = {
        {"toString", 0, GradidoUnit_toString, 0, 0, 0, napi_default, 0},
        {"negate", 0, GradidoUnit_negate, 0, 0, 0, napi_default, 0},
        {"negated", 0, GradidoUnit_negated, 0, 0, 0, napi_default, 0},
        {"add", 0, GradidoUnit_add, 0, 0, 0, napi_default, 0},
        {"plus", 0, GradidoUnit_plus, 0, 0, 0, napi_default, 0},
        {"sub", 0, GradidoUnit_sub, 0, 0, 0, napi_default, 0},
        {"minus", 0, GradidoUnit_minus, 0, 0, 0, napi_default, 0},
        {"decay", 0, GradidoUnit_decay, 0, 0, 0, napi_default, 0},
        {"decayed", 0, GradidoUnit_decayed, 0, 0, 0, napi_default, 0},
        {"compoundInterest", 0, GradidoUnit_compoundInterest, 0, 0, 0, napi_default, 0},
        {"equal", 0, GradidoUnit_equal, 0, 0, 0, napi_default, 0},
        {"eq", 0, GradidoUnit_eq, 0, 0, 0, napi_default, 0},
        {"notEqual", 0, GradidoUnit_notEqual, 0, 0, 0, napi_default, 0},
        {"ne", 0, GradidoUnit_ne, 0, 0, 0, napi_default, 0},
        {"greaterThan", 0, GradidoUnit_greaterThan, 0, 0, 0, napi_default, 0},
        {"gt", 0, GradidoUnit_gt, 0, 0, 0, napi_default, 0},
        {"lessThan", 0, GradidoUnit_lessThan, 0, 0, 0, napi_default, 0},
        {"lt", 0, GradidoUnit_lt, 0, 0, 0, napi_default, 0},
        {"greaterOrEqual", 0, GradidoUnit_greaterOrEqual, 0, 0, 0, napi_default, 0},
        {"gte", 0, GradidoUnit_gte, 0, 0, 0, napi_default, 0},
        {"lessOrEqual", 0, GradidoUnit_lessOrEqual, 0, 0, 0, napi_default, 0},
        {"lte", 0, GradidoUnit_lte, 0, 0, 0, napi_default, 0},
        {"secondsBetween", 0, GradidoUnit_secondsBetween, 0, 0, 0, napi_static, 0},
    };

    napi_value constructor;
    napi_define_class(env, "GradidoUnit", NAPI_AUTO_LENGTH,
        GradidoUnit_constructor, NULL,
        sizeof(props)/sizeof(*props),
        props,
        &constructor);

    napi_create_reference(env, constructor, 1, &constructor_ref);
    napi_set_named_property(env, exports, "GradidoUnit", constructor);

    return exports;
}

NAPI_MODULE(GradidoUnit, Init)