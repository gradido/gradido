#include "gradido_blockchain_core/types/cross_group.h"

const char *grdt_cross_group_to_string(grdt_cross_group cross_group) {
  static const char *messages[] = {
      [GRDT_CROSS_GROUP_LOCAL] = "GRDT_CROSS_GROUP_LOCAL",
      [GRDT_CROSS_GROUP_INBOUND] = "GRDT_CROSS_GROUP_INBOUND",
      [GRDT_CROSS_GROUP_OUTBOUND] = "GRDT_CROSS_GROUP_OUTBOUND",
      [GRDT_CROSS_GROUP_CROSS] = "GRDT_CROSS_GROUP_CROSS",
  };

  if (cross_group < 0 || cross_group >= (int)(sizeof(messages) / sizeof(messages[0]))) {
    return "GRDT_CROSS_GROUP_UNKNOWN";
  }

  const char *msg = messages[cross_group];
  return msg ? msg : "GRDT_CROSS_GROUP_UNKNOWN";
}
