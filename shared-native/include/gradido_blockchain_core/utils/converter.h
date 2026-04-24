#ifndef GRADIDO_BLOCKCHAIN_C_UTILS_H
#define GRADIDO_BLOCKCHAIN_C_UTILS_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Convert a uint64_t value into a string using the LR-algorithm.
 *
 * Write null terminated string to buffer.
 * The LR-algorithm is a faster integer to string conversion algorithm.
 * More information can be found at:
 * https://medium.com/data-science/34-faster-integer-to-string-conversion-algorithm-c72453d25352
 *
 * @param value The value to convert to a string
 * @param buffer The buffer to store the string
 * @param bufferSize The size of the buffer
 * @return The number of characters that would have been written if buffer had been sufficiently large, not counting the terminating null character.
 */
size_t grdu_uint64_to_string(char* buffer, size_t bufferSize, uint64_t value);

/**
 * @brief Convert a uint64_t value into a string using the LR-algorithm, but with known string size
 *
 * This function is for hot path use, it don't calculate string size by itself, but expects it as parameter, this allows to check buffer size before conversion and avoid calculating string size twice in hot path.
 *
 * @param buffer The buffer to store the string, is expected to be at least stringSize + 1 characters long (including null terminator)
 * @param value The value to convert to a string
 * @param stringSize The known size of the resulting string (result from grdu_uint64_to_string_size)
 * @return The number of characters written to the buffer
 */
size_t grdu_uint64_to_string_known_string_size(char* buffer, uint64_t value, size_t stringSize);

/**
 * @brief Calculate the size of the string representation of a uint64_t value
 *
 * @param value The value to calculate the string size for
 * @return The size of the string representation of the value, not counting the terminating null character.
 */
size_t grdu_uint64_to_string_size(uint64_t value);

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_C_UTILS_H
