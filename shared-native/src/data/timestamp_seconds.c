#include "gradido_blockchain_core/data/timestamp.h"
#include "gradido_blockchain_core/data/types.h"

grdd_timestamp_seconds grdd_timestamp_seconds_from_timestamp(const grdd_timestamp *timestamp) {
  return timestamp->seconds;
}
