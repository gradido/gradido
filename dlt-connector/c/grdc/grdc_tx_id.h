#ifndef __GRADIDO_BLOCKCHAIN_C_COMPACT_TRANSACTION_ID
#define __GRADIDO_BLOCKCHAIN_C_COMPACT_TRANSACTION_ID

#include <stdbool.h> 
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct grdc_tx_id 
{
  uint64_t nr;
  uint32_t communityIdIndex;
} grdc_tx_id;

inline bool grdc_tx_id_empty(const grdc_tx_id* id) {
  return !id->nr && !id->communityIdIndex;
}

#ifdef __cplusplus
}
#endif

#endif // __GRADIDO_BLOCKCHAIN_C_COMPACT_TRANSACTION_ID
