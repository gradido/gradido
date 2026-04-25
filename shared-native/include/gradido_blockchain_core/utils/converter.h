#ifndef GRADIDO_BLOCKCHAIN_C_UTILS_H
#define GRADIDO_BLOCKCHAIN_C_UTILS_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup utils Utilities */

/**
 * @defgroup grdu_converter grdu_converter
 * @ingroup utils
 * @brief Efficient conversion of uint64_t to string and size measurement.
 * Provides functions to convert uint64_t values to their string representation using the LR-algorithm, as well as a function to calculate the required string size for a given uint64_t value. These functions are optimized for performance and can be used in hot paths where efficiency is critical.
 * @{
 */

/**
 * @brief Transform a uint64_t into its string representation using the LR-algorithm.
 *
 * The LR-algorithm streams digits efficiently through optimized processing. See:
 * https://medium.com/data-science/34-faster-integer-to-string-conversion-algorithm-c72453d25352
 *
 * @param[out] buffer      Destination buffer receiving the resulting string.
 * @param[in]  bufferSize  Size of buffer (must contain result + null terminator).
 * @param[in]  value       The uint64_t value to transform.
 *
 * @return
 *   Characters written (excluding '\0'). If buffer is too small, returns
 *   the length that would have been needed — a hint for the caller.
 *
 * @whisper Number becomes word, digit by digit
 */
size_t grdu_uint64_to_string(char* buffer, size_t bufferSize, uint64_t value);

/**
 * @brief Convert a uint64_t to string, when its length is already known.
 *
 * Optimized for hot paths: skips redundant size calculation when length flows in
 * from a prior call to grdu_uint64_to_string_size. Reduces overhead in tight loops.
 *
 * @param[out] buffer      Destination buffer, must be at least stringSize + 1 bytes.
 * @param[in]  value       The uint64_t value to transform.
 * @param[in]  stringSize  Pre-calculated string length (from grdu_uint64_to_string_size).
 *
 * @return
 *   Number of characters written (excluding '\0').
 *
 * @note Caller is responsible for ensuring buffer space is adequate.
 *
 * @whisper When size is known, conversion becomes a smooth stride
 */
size_t grdu_uint64_to_string_known_string_size(char* buffer, uint64_t value, size_t stringSize);

/**
 * @brief Measure the length of a uint64_t's string representation.
 *
 * Calculates exactly how many character-places a number will need before
 * conversion. Useful for pre-allocating buffers or coordinating with
 * grdu_uint64_to_string_known_string_size to avoid double-calculation.
 *
 * @param[in] value  The uint64_t value to measure.
 *
 * @return
 *   String length in characters (excluding null terminator).
 *
 * @whisper Know the shape before filling the space
 */
size_t grdu_uint64_to_string_size(uint64_t value);

/**
 * @}
 */

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_C_UTILS_H
