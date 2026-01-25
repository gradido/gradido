#ifndef __GRADIDO_BLOCKCHAIN_C_DATA_TIMESTAMP_H
#define __GRADIDO_BLOCKCHAIN_C_DATA_TIMESTAMP_H

#include <stdbool.h> 
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct grdd_timestamp 
{
  int64_t seconds;
  int32_t nanos;
} grdd_timestamp;

inline bool grdd_timestamp_empty(const grdd_timestamp* timestamp) {
  return !timestamp->seconds && !timestamp->nanos;
}
inline bool grdd_timestamp_eq(const grdd_timestamp* t1, grdd_timestamp* t2) {
  return t1->seconds == t2->seconds && t1->nanos == t2->nanos;
}
inline bool grdd_timestamp_gt(const grdd_timestamp* t1, const grdd_timestamp* t2) {
  return t1->seconds > t2->seconds || t1->seconds == t2->seconds && t1->nanos > t2->nanos;
}
inline bool grdd_timestamp_lt(const grdd_timestamp* t1, const grdd_timestamp* t2) {
  return t1->seconds < t2->seconds || t1->seconds == t2->seconds && t1->nanos < t2->nanos;
}
inline grdd_timestamp grdd_timestamp_sub(const grdd_timestamp* t1, grdd_timestamp* t2) {
  grdd_timestamp result{.seconds = t1->seconds - t2->seconds, .nanos = t1->nanos - t2->nanos};
  return result;
}

#ifdef __cplusplus
}
#endif

#endif // __GRADIDO_BLOCKCHAIN_C_DATA_TIMESTAMP_H