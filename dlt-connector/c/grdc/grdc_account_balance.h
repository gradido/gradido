#ifndef __GRADIDO_BLOCKCHAIN_C_COMPACT_ACCOUNT_BALANCE_H
#define __GRADIDO_BLOCKCHAIN_C_COMPACT_ACCOUNT_BALANCE_H

#include <stdint.h>
#include "grdc_public_key_index.h"
#include "../grdl/grdl_unit.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct grdc_account_balance
{
  grdl_unit balance;
  grdc_public_key_index publicKeyIndex;
} grdc_account_balance;

#ifdef __cplusplus
}
#endif


#endif // __GRADIDO_BLOCKCHAIN_C_COMPACT_ACCOUNT_BALANCE_H