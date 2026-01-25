#ifndef __GRADIDO_BLOCKCHAIN_C_COMPACT_TRANSACTION_TIMESTAMPS_H
#define __GRADIDO_BLOCKCHAIN_C_COMPACT_TRANSACTION_TIMESTAMPS_H

#include <stdint.h>
#include "../grdd/grdd_timestamp.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct grdc_tx_timestamps
{
  uint64_t confirmedSeconds;
  uint32_t confirmedNanos;
  int32_t deltaMs; // add to confirmed second and nanos to get created_at
} grdc_tx_timestamps;

inline grdd_timestamp grdc_tx_timestamps_get_confirmed_at(const grdc_tx_timestamps* in) {
  grdd_timestamp t;
  t.seconds = in->confirmedSeconds;
  t.nanos = in->confirmedNanos;
  return t;
}

inline grdd_timestamp grdc_tx_timestamps_get_created_at(const grdc_tx_timestamps* in) {
  grdd_timestamp t;
  uint64_t sec = (in->confirmedSeconds + in->deltaMs) / 1000;
  uint32_t ns  = (in->confirmedNanos + (in->deltaMs % 1000)) * 1000000;
  if (ns >= 1000000000) {
    sec += 1;
    ns  -= 1000000000;
  }
  t.seconds = sec;
  t.nanos = ns;
  return t;
}

#ifdef __cplusplus
}
#endif

#endif //__GRADIDO_BLOCKCHAIN_C_COMPACT_TRANSACTION_TIMESTAMPS_H