#ifndef GRADIDO_BLOCKCHAIN_CORE_DATA_UNIT_H
#define GRADIDO_BLOCKCHAIN_CORE_DATA_UNIT_H

#include "types.h"

#include "r128/r128.h"

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup data Primary Data Structures */

/**
 * @defgroup grdd_unit grdd_unit
 * @ingroup data
 * @brief Fixed-point representation of GDD with 4 decimal places.
 *
 * A fixed-point representation of GDD with 4 decimal places. The value is
 * scaled by 10^4 to maintain precision without floating-point. For example:
 * - 1.2345 GDD is represented as 12345 (1.2345 * 10^4)
 * - 0.0001 GDD is represented as 1 (0.0001 * 10^4)
 * - 100 GDD is represented as 1000000 (100 * 10^4)
 * @{
 */

typedef int64_t grdd_unit;

/**
 * @brief Round a fixed-point grdd_unit to a given decimal precision.
 *
 * Performs deterministic HALF-UP rounding using pure integer arithmetic.
 * The value is scaled by 10^4, and precision trims it down to 0–4 decimals.
 *
 * No floating-point illusions — every bit lands exactly where it should.
 *
 * @param[out] result     Where the rounded value will be stored (must not be NULL).
 * @param[in]  value      Input value (fixed-point, scaled by 10^4).
 * @param[in]  precision  Target decimals (0–4). 4 = unchanged.
 *
 * @return
 *   true  - success
 *   false - invalid input, precision out of range, or overflow
 *
 * @note HALF-UP means: halfway cases are nudged away from zero.
 *
 * @whisper Even rounding has its instincts — and this one always chooses a side.
 */
bool grdd_unit_round_to_precision(grdd_unit* result, grdd_unit value, uint8_t precision);

/**
 * @brief Convert a floating-point value into fixed-point grdd_unit.
 *
 * Takes a double and converts it to the deterministic realm of fixed-point.
 * Rounds to 4 decimal places, then scales by 10^4. A bridge flows between
 * the fuzzy world of floats and the crisp structure of integers.
 *
 * @param[in] gdd  Input value as double.
 *
 * @return
 *   Fixed-point representation (scaled by 10^4).
 *
 * @note Internally rounded to 4 decimals before scaling.
 *
 * @warning Floating-point input may already carry tiny inaccuracies.
 *
 * @whisper Soft chaos enters… leaves as structured order.
 */
grdd_unit grdd_unit_from_decimal(double gdd);

/**
 * @brief Convert a fixed-point grdd_unit into a floating-point value.
 *
 * Divides by 10^4 to restore the decimal representation. Simple and direct,
 * yet precision yields a little — the trade-off for readability. Floats
 * carry a gentle drift, a natural consequence of their fluid nature.
 *
 * @param[in] value  Fixed-point value (scaled by 10^4).
 *
 * @return
 *   Value as double.
 *
 * @warning Result may not be exact due to floating-point representation.
 *
 * @whisper Precision loosens its grip… just a little.
 */
double grdd_unit_to_decimal(grdd_unit value);

/**
 * @brief Parse a decimal string into fixed-point grdd_unit with deterministic rounding.
 *
 * Reads up to 4 fractional digits and applies explicit HALF-UP rounding
 * based on the 5th digit. Everything beyond settles into silence — quietly set aside,
 * no platform quirks, no strtod mysteries. The conversion flows clear and predictable.
 *
 * @param[out] resultGdd  Parsed result (must not be NULL).
 * @param[in]  gdd_string Null-terminated decimal string.
 *
 * @return
 *   true  - valid and parsed
 *   false - invalid format, overflow, or NULL input
 *
 * @note Max integer part is limited to prevent int64 overflow.
 *
 * @whisper String distills to essence — only what matters persists
 */
bool grdd_unit_from_string(grdd_unit* resultGdd, const char* gdd_string);

/**
 * @brief Get the global decay start timestamp.
 *
 * All decay calculations converge to no earlier than this moment.
 * Time before it simply does not exist in the decay system — it is outside
 * the rhythm. This is the origin, the first moment when the second natural law begins.
 *
 * @return
 *   Start timestamp in seconds.
 *
 * @whisper The clock begins when the world is ready — not before.
 */
grdd_timestamp_seconds grdd_unit_decay_start_time();

/**
 * @brief Calculate effective duration (in seconds) for decay between two timestamps.
 *
 * Ensures the interval respects the global decay start time. Anything before
 * that threshold is clipped away, leaving only the moments that participate
 * in decay. Time converges to what truly counts.
 *
 * @param[in]  startTime   Start timestamp.
 * @param[in]  endTime     End timestamp.
 * @param[out] outSeconds  Resulting duration (must not be NULL).
 *
 * @return
 *   true  - valid interval
 *   false - invalid input (NULL or startTime > endTime)
 *
 * @note If both timestamps lie before decay start, result is 0.
 *
 * @whisper Only the moments in the rhythm are counted
 */
bool grdd_unit_calculate_duration_seconds(grdd_timestamp_seconds startTime, grdd_timestamp_seconds endTime, grdd_duration_seconds* outSeconds);

/**
 * @brief Format a fixed-point grdd_unit into a decimal string.
 *
 * Produces a human-readable number with configurable precision (0–4 digits).
 * Internally rounded using deterministic integer logic.
 *
 * Output rules:
 * - Optional '-' for negative values
 * - '.' appears only if precision > 0
 * - Fraction is trimmed to requested precision
 *
 * @param[out] buffer       Destination buffer.
 * @param[in]  bufferSize   Size of buffer (must include space for '\0').
 * @param[in]  value        Fixed-point value (scaled by 10^4).
 * @param[in]  precision    Number of decimal places (0–4).
 *
 * @return
 *   >= 0 - characters written (excluding '\0')
 *   -1   - invalid buffer
 *   -2   - rounding failure
 *
 * @note Max output length ~22 chars.
 *
 * @warning Buffer must be large enough — no sneaky reallocations.
 *
 * @whisper Numbers form, arranged precisely — as requested, nothing more
 */
int grdd_unit_to_string(char* buffer, size_t bufferSize, grdd_unit value, uint8_t precision);

/**
 * @brief Applies time-based decay (or its inverse for forward preparation).
 *
 * Gradido recognizes three natural laws of balanced economies. Among them is
 * the cycle of becoming and passing away – the gentle rhythm that turns sprout
 * into leaf, leaf into soil, soil into new sprout. Value, too, follows this law.
 *
 * This function embodies that law: each year reduces the value by half.
 * Stored value softens over time, making space for new contribution and shared
 * benefit. Stillness yields to movement.
 *
 * For positive duration, the function decays a starting value forward in time.
 * For negative duration, it computes the value needed at an earlier point so
 * that, after decay over that duration, a desired amount remains. This allows
 * preparing a transfer where the receiver obtains a stable value even after
 * time has passed – the amount is "sent ahead" with the right buffer for decay.
 *
 * The implementation uses deterministic 128-bit fixed-point arithmetic and
 * exponentiation by squaring. Results are consistent across all platforms,
 * steady and reproducible like the cycle of seasons.
 *
 * Large durations are handled efficiently:
 * - Whole years use bit shifts (division by powers of two)
 * - Remaining seconds use precise exponential scaling
 *
 * @param[in] gdd
 *   For positive duration: the starting value.
 *   For negative duration: the desired value after decay.
 *
 * @param[in] duration
 *   Time delta in seconds. Positive = decay forward in time,
 *   negative = calculate the earlier value needed to arrive at @p gdd.
 *
 * @return
 *   Transformed value. For positive duration, decays toward zero (reaches 0
 *   after roughly 63 years). For negative duration, grows backward in time
 *   to compensate for future decay.
 *
 * @whisper Half with each turning year — the second law at work, steady as seasons.
 */

grdd_unit grdd_unit_calculate_decay(grdd_unit gdd, grdd_duration_seconds duration);

/**
 * @}
 */

#ifdef __cplusplus
}
#endif


#endif // GRADIDO_BLOCKCHAIN_CORE_DATA_UNIT_H