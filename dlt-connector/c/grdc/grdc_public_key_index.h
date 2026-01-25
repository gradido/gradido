#ifndef __GRADIDO_BLOCKCHAIN_C_COMPACT_PUBLIC_KEY_INDEX_H
#define __GRADIDO_BLOCKCHAIN_C_COMPACT_PUBLIC_KEY_INDEX_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct grdc_public_key_index
{
  uint32_t publicKeyIndex;
  uint32_t communityIdIndex;
} grdc_public_key_index;

#ifdef __cplusplus
}
#endif


#endif // __GRADIDO_BLOCKCHAIN_C_COMPACT_PUBLIC_KEY_INDEX_H