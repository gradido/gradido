#ifndef GRADIDO_BLOCKCHAIN_CORE_ERROR_DETAILS_H
#define GRADIDO_BLOCKCHAIN_CORE_ERROR_DETAILS_H

#ifdef __cplusplus
extern "C" {
#endif

#include "result.h"
#include <inttypes.h>

typedef struct grd_memory grd_memory;

typedef struct grd_error_details {
  char *message;
  char *actual;
  char *expected;
  grd_memory *allocator;
  //! set Bit-Flags for every field, for which default malloc was used, instead of allocator
  //! 1 for message, 2 for actual and 4 for expected
  int used_default_malloc_flag;
} grd_error_details;

//! \param alloc is optional, can be null, but then grd_error_details_fill will use malloc for each
//! string
grd_result grd_error_details_init(grd_error_details *error_details, grd_memory *alloc);

//! \param alloc is optional, can be null, but then grd_error_details_fill will use malloc for each
//! string
grd_error_details *grd_error_details_create(grd_memory *alloc);

int grd_error_details_is_initalized_and_empty(grd_error_details *error_details);
//! use own allocator to allocate memory for error messages and copy them over with memcpy, only if
//! not set to null if allocator is full, will use default malloc
grd_result grd_error_details_fill(
    grd_error_details *error_details, const char *message, const char *actual, const char *expected
);
grd_result grd_error_details_fill_actual_is_number(
    grd_error_details *error_details,
    const char *message,
    const int64_t actual,
    const char *expected
);

const char *grd_error_details_get_message(const grd_error_details *error_details);
const char *grd_error_details_get_actual(const grd_error_details *error_details);
const char *grd_error_details_get_expected(const grd_error_details *error_details);

void grd_error_details_release(grd_error_details *error_details);
void grd_error_details_free(grd_error_details *error_details);

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_ERROR_DETAILS_H
