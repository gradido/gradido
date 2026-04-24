#ifndef GRADIDO_BLOCKCHAIN_CORE_UTILS_DURATION_H
#define GRADIDO_BLOCKCHAIN_CORE_UTILS_DURATION_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// store duration in nanoseconds, can represent up to ~292 years
typedef int64_t grdu_duration;

//! will write to buffer only if enough space
//! buffer need to be at least buffer_size (inclusive null terminator)
//! \return how many character would be written to buffer - not counting the terminating null character, if buffer was large enough
int grdu_duration_string(char* buffer, size_t buffer_size, grdu_duration duration, uint8_t precision);

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_UTILS_DURATION_H