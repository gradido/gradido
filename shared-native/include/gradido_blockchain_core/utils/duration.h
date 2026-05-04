#ifndef GRADIDO_BLOCKCHAIN_CORE_UTILS_DURATION_H
#define GRADIDO_BLOCKCHAIN_CORE_UTILS_DURATION_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup utils Utilities */

/**
 * @defgroup grdu_duration grdu_duration
 * @ingroup utils
 * @brief Duration representation in nanoseconds.
 *
 * A duration is represented in nanoseconds, allowing for precise time measurements.
 * This can represent up to ~292 years.
 * @{
 */


// store duration in nanoseconds, can represent up to ~292 years
typedef int64_t grdu_duration;

/**
 * @brief Format a duration into a human-readable string, letting the most fitting unit emerge.
 *
 * Takes a duration in nanoseconds and flows it into the most natural scale:
 * ns, us, ms, s, min, h, or days. The precision parameter shapes how many
 * decimal places settle into the output — truncated with clean edges, never rounded.
 *
 * Writes into the provided buffer only if sufficient space exists.
 *
 * @param[out] buffer        Destination buffer for the resulting string.
 * @param[in]  buffer_size   Size of buffer in bytes (must include space for '\0').
 * @param[in]  duration      Duration in nanoseconds (must be >= 0).
 * @param[in]  precision     Decimal places after the point (capped at 15 to prevent overflow).
 *
 * @return
 *   >= 0  - Characters written (excluding '\0'). If buffer is too small,
 *           returns the size that would have been needed.
 *   -1    - Invalid input (negative duration).
 *
 * @note
 *   Truncation, not rounding. Example: precision=3 with 1.234567 s yields "1.234 s".
 *
 * @whisper Time settles into the scale it needs
 */
int grdu_duration_string(char* buffer, size_t buffer_size, grdu_duration duration, uint8_t precision);

/**
 * @}
 */

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_UTILS_DURATION_H