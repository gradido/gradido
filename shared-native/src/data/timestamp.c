#include "gradido_blockchain_core/data/timestamp.h"
#include "gradido_blockchain_core/data/types.h"
#include "gradido_blockchain_core/utils/converter.h"

#include <string.h>

grdd_timestamp grdd_timestamp_minus(const grdd_timestamp *t1, const grdd_timestamp *t2) {
  int32_t nanos = t1->nanos - t2->nanos;
  if (nanos < 0) {
    return (grdd_timestamp){.seconds = t1->seconds - t2->seconds - 1, .nanos = nanos + 1000000000};
  }
  return (grdd_timestamp){.seconds = t1->seconds - t2->seconds, .nanos = nanos};
}

grdd_timestamp grdd_timestamp_plus(const grdd_timestamp *t1, const grdd_timestamp *t2) {
  int32_t nanos = t1->nanos + t2->nanos;
  if (nanos >= 1000000000) {
    return (grdd_timestamp){.seconds = t1->seconds + t2->seconds + 1, .nanos = nanos - 1000000000};
  }
  return (grdd_timestamp){.seconds = t1->seconds + t2->seconds, .nanos = nanos};
}

grdd_timestamp grdd_timestamp_from_timestamp_seconds(
    const grdd_timestamp_seconds timestamp_seconds
) {
  return (grdd_timestamp){.seconds = timestamp_seconds, .nanos = 0};
}

int64_t grdd_timestamp_get_seconds(const grdd_timestamp *timestamp) {
  if (!timestamp) { return 0; }
  return timestamp->seconds;
}

int32_t grdd_timestamp_get_nanos(const grdd_timestamp *timestamp) {
  if (!timestamp) { return 0; }
  return timestamp->nanos;
}

size_t grdd_timestamp_calculate_string_size(const grdd_timestamp *timestamp) {
  if (!timestamp) { return 0; }
  // always 9 for nano seconds, and pad with 0
  return grdu_int64_to_string_size(timestamp->seconds) + 9 + 1;
}

size_t grdd_timestamp_to_string(char *buffer, size_t buffer_size, const grdd_timestamp *timestamp) {
  if (!buffer || !buffer_size || !timestamp) { return 0; }

  size_t seconds_size = grdu_int64_to_string_size(timestamp->seconds);
  size_t nanos_size = grdu_int64_to_string_size(timestamp->nanos);
  size_t result_size = seconds_size + 1 + 9;
  if (buffer_size < result_size) { return result_size; }

  grdu_int64_to_string_known_string_size(buffer, timestamp->seconds, seconds_size);
  buffer += seconds_size;
  *buffer = '.';
  buffer++;
  int zeroPadCount = 9 - nanos_size;
  if (zeroPadCount) {
    memset(buffer, '0', zeroPadCount);
    buffer += zeroPadCount;
  }
  grdu_int64_to_string_known_string_size(buffer, timestamp->nanos, nanos_size);
  return result_size;
}
