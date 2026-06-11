#ifndef GRADIDO_BLOCKCHAIN_C_UTILS_H
#define GRADIDO_BLOCKCHAIN_C_UTILS_H

#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/result.h"

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct grd_memory_block grd_memory_block;
typedef struct grd_memory grd_memory;

/** @defgroup utils Utilities */

/**
 * @defgroup grdu_converter grdu_converter
 * @ingroup utils
 * @brief Efficient conversion of uint64_t to string and size measurement.
 * Provides functions to convert uint64_t values to their string representation using the
 * LR-algorithm, as well as a function to calculate the required string size for a given uint64_t
 * value. These functions are optimized for performance and can be used in hot paths where
 * efficiency is critical.
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
size_t grdu_uint64_to_string(char *buffer, size_t bufferSize, uint64_t value);
size_t grdu_int64_to_string(char *buffer, size_t bufferSize, int64_t value);

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
size_t grdu_uint64_to_string_known_string_size(char *buffer, uint64_t value, size_t stringSize);
size_t grdu_int64_to_string_known_string_size(char *buffer, int64_t value, size_t stringSize);

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
size_t grdu_int64_to_string_size(int64_t value);

#ifdef USE_SODIUM

/**
 * @param[out] result_buffer expected to be 37 bytes for string uuid format with \0
 */
void grdu_uuid_to_string(char *result_buffer, const uint8_t uuid[UUID_BINARY_SIZE]);

/**
 * @param [out] uuid expect to be 16 bytes for uuid in binary representation
 * @param [in] uuid_string expect to be exactly 37 (36 + \0) bytes long
 */
grd_result grdu_uuid_from_string(uint8_t *uuid, const char *uuid_string);

/**
 * @param result_buffer expected to be data->size * 2 + 1
 */
grd_result grdu_binary_to_hex(char *result_buffer, const grd_memory_block *data);

/**
 * @param result_buffer[out] expected to be strlen(hex) / 2
 * @param hex[in] expected to be null terminated string
 */
grd_result grdu_binary_from_hex(uint8_t *result_buffer, const char *hex);

/**
 * for precalculation of neccessary size
 */
size_t grdu_binary_to_base64_length(size_t binSize);

/**
 * reserve enough memory before in result_block, for example with grdu_binary_to_base64_length
 * will write string with terminator \0 into result_block->data
 */
grd_result grdu_binary_to_base64_with_known_size(
    grd_memory_block *result_block, const grd_memory_block *data
);

/**
 * will reserve memory through allocator
 */
grd_result grdu_binary_to_base64(
    grd_memory_block *result_block, const grd_memory_block *data, grd_memory *allocator
);

/**
 * @param result_buffer[out] expected to be (strlen(base64_str) / 4) * 3
 * @param base64_str[in] expected to be null terminated string
 * @return actual binary size or 0 on error
 */
size_t grdu_binary_from_base64(uint8_t *result_buffer, const char *base64_str);

#endif // USE_SODIUM
/**
 * @}
 */

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_C_UTILS_H
