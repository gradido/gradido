#ifndef GRADIDO_BLOCKCHAIN_C_DATA_UNIT_H
#define GRADIDO_BLOCKCHAIN_C_DATA_UNIT_H

#include <stdbool.h> 
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef int64_t grdd_unit;
typedef int64_t grdd_timestamp_seconds;
typedef int64_t grdd_duration_seconds;

 /**
 * @brief Rounds a fixed-point grdd_unit value to a specified decimal precision.
 *
 * This function performs deterministic HALF-UP rounding using integer arithmetic.
 * The input value is assumed to use a fixed scale of 4 decimal places.
 *
 * Rounding is applied by reducing the number of fractional digits to the
 * requested precision (0–4). Values are rounded away from zero at the midpoint.
 *
 * The implementation avoids floating-point arithmetic entirely, ensuring
 * reproducible and platform-independent results, which is essential for
 * financial or consensus-critical calculations.
 *
 * @param[in]  value
 *   The input value in fixed-point representation (scaled by 10^4).
 *
 * @param[in]  precision
 *   Target number of decimal places (0–3). 4 will return the value as is and > 4 will return false.
 *
 * @param[out] result
 *   Pointer to store the rounded result. Must not be NULL.
 *
 * @return
 *   true  - rounding succeeded
 *   false - result pointer is NULL, precision out of range, or result would overflow int64_t
 *           (< -922337203685476 or > 922337203685476)
 */
bool grdd_unit_round_to_precision(grdd_unit value, uint8_t precision, grdd_unit* result);

grdd_unit grdd_unit_from_decimal(double gdd);
double grdd_unit_to_decimal(grdd_unit u);

/**
 * @brief Parses a decimal string into a fixed-point grdd_unit (scaled by 10,000)
 *        using integer arithmetic with explicit HALF-UP rounding.
 *
 * This function is intentionally implemented without using floating-point
 * parsing (e.g. strtod) to guarantee deterministic and precise results.
 *
 * Floating-point types cannot exactly represent most decimal fractions,
 * which may introduce rounding errors. In financial or consensus-critical
 * systems, even the smallest deviation (0.0001 GDD) is unacceptable.
 *
 * Instead, this function performs controlled HALF-UP rounding at the 5th
 * decimal place and directly converts the value into the internal fixed-point
 * representation.
 *
 * @param[in]  gdd_string
 *   Null-terminated decimal string to parse.
 *
 * @param[out] resultGdd
 *   Output pointer. If not NULL and parsing succeeds, the parsed
 *   value (in GDD cents) will be written here.
 *
 * @return
 *   true  - parsing succeeded
 *   false - input or output is NULL, invalid format, or integer part out of range
 *           (< -922337203685476 or > 922337203685476)
 */
bool grdd_unit_from_string(const char* gdd_string, grdd_unit* resultGdd);

static inline grdd_unit grdd_unit_negated(const grdd_unit u) 
{
  return u * -1;
}

static inline void grdd_unit_negate(grdd_unit* u)
{
    if (u) *u = -*u;
}

grdd_timestamp_seconds grdd_unit_get_decay_start_time();

//! return false if startTime > endTime
//! make sure that returned duration starts after decay start time, returns 0 if time range is entirely before decay start time
bool grdd_unit_calculate_duration_seconds(grdd_timestamp_seconds startTime, grdd_timestamp_seconds endTime, grdd_duration_seconds* outSeconds);

/**
 * @brief Converts a fixed-point grdd_unit value to its string representation.
 *
 * This function formats a grdd_unit value (scaled by 10^4) into a human-readable
 * decimal string with the specified precision (0–4 fractional digits).
 *
 * The value is first rounded using HALF-UP rounding to the requested precision.
 * If the requested precision is greater than 4, it is clamped to 4.
 *
 * The resulting string:
 * - Includes a leading '-' sign for negative values
 * - Uses a '.' as decimal separator if precision > 0
 * - Omits the fractional part entirely if precision == 0
 *
 * The conversion is performed using integer arithmetic only, ensuring
 * deterministic and platform-independent results.
 *
 * @param[in]  u
 *   The input value in fixed-point representation (scaled by 10^4).
 *
 * @param[out] buffer
 *   Destination buffer to store the resulting null-terminated string.
 *   The caller must ensure that the buffer is large enough. Maximal possible size should be 22 characters.
 *
 * @param[in]  precision
 *   Number of digits after the decimal point (0–4). Values greater than 4
 *   are clamped to 4.
 *
 * @return
 *   >= 0 - number of characters written (excluding null terminator)
 *   -1   - rounding failed (e.g. due to overflow)
 */
int grdd_unit_to_string(grdd_unit u, char* buffer, uint8_t precision);

grdd_unit grdd_unit_calculate_decay(grdd_unit u, grdd_duration_seconds duration);

#ifdef __cplusplus
}
#endif


#endif // GRADIDO_BLOCKCHAIN_C_DATA_UNIT_H