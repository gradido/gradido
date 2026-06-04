#ifndef GRADIDO_BLOCKCHAIN_CORE_TYPES_CROSS_GROUP_H
#define GRADIDO_BLOCKCHAIN_CORE_TYPES_CROSS_GROUP_H

#ifdef __cplusplus
extern "C" {
#endif

typedef enum grdt_cross_group {
  GRDT_CROSS_GROUP_LOCAL = 0,
  GRDT_CROSS_GROUP_INBOUND = 1,
  GRDT_CROSS_GROUP_OUTBOUND = 2,
  GRDT_CROSS_GROUP_CROSS = 3
} grdt_cross_group;

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_TYPES_CROSS_GROUP_H
