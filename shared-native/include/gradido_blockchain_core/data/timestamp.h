#ifndef GRADIDO_BLOCKCHAIN_CORE_DATA_TIMESTAMP_H
#define GRADIDO_BLOCKCHAIN_CORE_DATA_TIMESTAMP_H

#include "types.h"

#include <stdbool.h>
#include <stdint.h>
#include <time.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct grdd_timestamp {
  int64_t seconds;
  int32_t nanos;
} grdd_timestamp;

static inline bool grdd_timestamp_empty(const grdd_timestamp *timestamp) {
  return !timestamp->seconds && !timestamp->nanos;
}

static inline bool grdd_timestamp_eq(const grdd_timestamp *t1, grdd_timestamp *t2) {
  return t1->seconds == t2->seconds && t1->nanos == t2->nanos;
}

static inline bool grdd_timestamp_gt(const grdd_timestamp *t1, const grdd_timestamp *t2) {
  return t1->seconds > t2->seconds || t1->seconds == t2->seconds && t1->nanos > t2->nanos;
}

static inline bool grdd_timestamp_lt(const grdd_timestamp *t1, const grdd_timestamp *t2) {
  return t1->seconds < t2->seconds || t1->seconds == t2->seconds && t1->nanos < t2->nanos;
}

grdd_timestamp grdd_timestamp_minus(const grdd_timestamp *t1, const grdd_timestamp *t2);
grdd_timestamp grdd_timestamp_plus(const grdd_timestamp *t1, const grdd_timestamp *t2);

static inline grdd_timestamp grdd_timestamp_from_seconds(int64_t seconds) {
  grdd_timestamp timestamp;
  timestamp.seconds = seconds;
  timestamp.nanos = 0;
  return timestamp;
}

grdd_timestamp grdd_timestamp_from_timestamp_seconds(
    const grdd_timestamp_seconds timestamp_seconds
);

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_DATA_TIMESTAMP_H
