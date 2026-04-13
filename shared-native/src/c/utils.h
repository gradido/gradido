#ifndef GRADIDO_BLOCKCHAIN_C_UTILS_H
#define GRADIDO_BLOCKCHAIN_C_UTILS_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Convert a uint64_t value into a string using the LR-algorithm
 *
 * The LR-algorithm is a faster integer to string conversion algorithm.
 * More information can be found at:
 * https://medium.com/data-science/34-faster-integer-to-string-conversion-algorithm-c72453d25352
 *
 * @param value The value to convert to a string
 * @param buffer The buffer to store the string, must be at least 20 characters long
 * @return The number of characters written to the buffer
 */
size_t grdu_uint64ToString(uint64_t value, char* buffer);

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_C_UTILS_H
