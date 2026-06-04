#ifndef GRADIDO_BLOCKCHAIN_CORE_MAPPING_MEMO_KEY_PB_COMPAT_H
#define GRADIDO_BLOCKCHAIN_CORE_MAPPING_MEMO_KEY_PB_COMPAT_H

#include "gradido_blockchain_core/data/proto/gradido/basic_types.h"
#include "gradido_blockchain_core/types/memo_key.h"
#include <assert.h>

#ifdef __cplusplus
extern "C" {
#endif

/*
 * C11 static assert fallback safety
 */
#if !defined(static_assert)
#define static_assert _Static_assert
#endif

/*
 * Ensure pbtools enum == internal enum mapping stays stable.
 *
 * IMPORTANT:
 * If ANY of these fail, protobuf generation or enum ordering changed.
 */

#pragma warning(push)
#pragma warning(disable : 5287)

// SHARED SECRET
static_assert(
    (int)GRDT_MEMO_KEY_SHARED_SECRET == (int)proto_gradido_encrypted_memo_shared_secret_e,
    "MemoKeyType enum mismatch: SHARED SECRET"
);

// COMMUNITY SECRET
static_assert(
    (int)GRDT_MEMO_KEY_COMMUNITY_SECRET == (int)proto_gradido_encrypted_memo_community_secret_e,
    "MemoKeyType enum mismatch: COMMUNITY SECRET"
);

// PLAIN
static_assert(
    (int)GRDT_MEMO_KEY_PLAIN == (int)proto_gradido_encrypted_memo_plain_e,
    "MemoKeyType enum mismatch: PLAIN"
);

#pragma warning(pop)

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_MAPPING_MEMO_KEY_PB_COMPAT_H
