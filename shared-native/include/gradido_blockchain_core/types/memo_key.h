#ifndef GRADIDO_BLOCKCHAIN_CORE_TYPES_MEMO_KEY_TYPE_H
#define GRADIDO_BLOCKCHAIN_CORE_TYPES_MEMO_KEY_TYPE_H

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
  GRDT_MEMO_KEY_SHARED_SECRET = 0,
  GRDT_MEMO_KEY_COMMUNITY_SECRET = 1,
  GRDT_MEMO_KEY_PLAIN = 2,
} grdt_memo_key;

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_TYPES_MEMO_KEY_TYPE_H
