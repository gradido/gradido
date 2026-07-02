#ifndef GRADIDO_BLOCKCHAIN_CORE_UTILS_VERSION_H
#define GRADIDO_BLOCKCHAIN_CORE_UTILS_VERSION_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Version encoding: major in high 16 bits, minor in low 16 bits
#define GRDU_VERSION_MAKE(major, minor) (((uint32_t)(major) << 16) | (uint32_t)(minor))
#define GRDU_VERSION_MAJOR(ver) ((uint32_t)(ver) >> 16)
#define GRDU_VERSION_MINOR(ver) ((uint32_t)(ver) & 0xFFFF)

extern const uint32_t GRDU_GRADIDO_PROTOCOL_VERSION;

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_UTILS_VERSION_H
