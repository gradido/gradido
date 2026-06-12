#include "gradido_blockchain_core/error_details.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/utils/converter.h"

#include <stdlib.h>
#include <string.h>

grd_result grd_error_details_init(grd_error_details *error_details, grd_memory *alloc) {
  if (!error_details) { return GRD_ERROR_NULL_POINTER; }
  memset(error_details, 0, sizeof(grd_error_details));
  error_details->allocator = alloc;
  return GRD_SUCCESS;
}

grd_error_details *grd_error_details_create(grd_memory *alloc) {
  grd_error_details *error_details = (grd_error_details *)malloc(sizeof(grd_error_details));
  grd_error_details_init(error_details, alloc);
  return error_details;
}

int grd_error_details_is_initalized_and_empty(grd_error_details *error_details) {
  return error_details && !error_details->message && !error_details->actual &&
         !error_details->expected && !error_details->used_default_malloc_flag;
}

static int alloc_and_fill_field(char **field, const char *input, grd_memory *alloc, int flag) {
  size_t size = strlen(input) + 1;
  int result_alloc_flag = 0;
  if (grd_memory_buffer_alloc((uint8_t **)field, alloc, size) != GRD_SUCCESS) {
    *field = (char *)malloc(size);
    result_alloc_flag = flag;
  }
  memcpy(*field, input, size);
  return result_alloc_flag;
}

grd_result grd_error_details_fill(
    grd_error_details *error_details, const char *message, const char *actual, const char *expected
) {
  if (!error_details) { return GRD_ERROR_NULL_POINTER; }
  if (error_details->message || error_details->actual || error_details->expected) {
    return GRD_ERROR_INVALID_STATE;
  }
  if (message) {
    error_details->used_default_malloc_flag |=
        alloc_and_fill_field(&error_details->message, message, error_details->allocator, 1);
  }
  if (actual) {
    error_details->used_default_malloc_flag |=
        alloc_and_fill_field(&error_details->actual, actual, error_details->allocator, 2);
  }
  if (expected) {
    error_details->used_default_malloc_flag |=
        alloc_and_fill_field(&error_details->expected, expected, error_details->allocator, 4);
  }
  return GRD_SUCCESS;
}

grd_result grd_error_details_fill_actual_is_number(
    grd_error_details *error_details,
    const char *message,
    const int64_t actual,
    const char *expected
) {
  if (!error_details) { return GRD_ERROR_NULL_POINTER; }
  if (error_details->message || error_details->actual || error_details->expected) {
    return GRD_ERROR_INVALID_STATE;
  }

  char strBuffer[22];
  memset(strBuffer, 0, 22);
  int strLen = grdu_int64_to_string(strBuffer, 22, actual);
  return grd_error_details_fill(error_details, message, strBuffer, expected);
}

static void release_field(char *field, grd_error_details *error_details, int field_flag) {
  if (!field || !error_details || !field_flag) { return; }
  if (field_flag == (field_flag & error_details->used_default_malloc_flag)) {
    free(field);
  } else {
    grd_memory_buffer_free(field, error_details->allocator);
  }
}

const char *grd_error_details_get_message(const grd_error_details *error_details) {
  if (!error_details) { return NULL; }
  return error_details->message;
}

const char *grd_error_details_get_actual(const grd_error_details *error_details) {
  if (!error_details) { return NULL; }
  return error_details->actual;
}

const char *grd_error_details_get_expected(const grd_error_details *error_details) {
  if (!error_details) { return NULL; }
  return error_details->expected;
}

void grd_error_details_release(grd_error_details *error_details) {
  if (!error_details) { return; }

  release_field(error_details->expected, error_details, 4);
  release_field(error_details->actual, error_details, 2);
  release_field(error_details->message, error_details, 1);
}

void grd_error_details_free(grd_error_details *error_details) {
  if (!error_details) { return; }
  grd_error_details_release(error_details);
  free(error_details);
}
