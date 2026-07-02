#include "gradido_blockchain_core/types/memo_key.h"

const char *grdt_memo_key_to_string(grdt_memo_key memo_key) {
  static const char *messages[] = {
      [GRDT_MEMO_KEY_SHARED_SECRET] = "GRDT_MEMO_KEY_SHARED_SECRET",
      [GRDT_MEMO_KEY_COMMUNITY_SECRET] = "GRDT_MEMO_KEY_COMMUNITY_SECRET",
      [GRDT_MEMO_KEY_PLAIN] = "GRDT_MEMO_KEY_PLAIN",
  };

  if (memo_key < 0 || memo_key >= (int)(sizeof(messages) / sizeof(messages[0]))) {
    return "GRDT_MEMO_KEY_UNKNOWN";
  }

  const char *msg = messages[memo_key];
  return msg ? msg : "GRDT_MEMO_KEY_UNKNOWN";
}