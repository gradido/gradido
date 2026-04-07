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

grdd_unit grdd_unit_round_to_precision(grdd_unit value, uint8_t precision);
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
 * @brief Converts a fixed-point grdd_unit value into a decimal string.
 *
 * The value is interpreted as a fixed-point number with 4 decimal places
 * (scaled by 10,000). The output is formatted according to the requested
 * precision, using HALF-UP rounding via grdd_unit_round_to_precision().
 *
 * No floating-point arithmetic is used, ensuring deterministic and
 * platform-independent results.
 *
 * @param[in]  u
 *   The input value in fixed-point representation (GDD cents).
 *
 * @param[out] buffer
 *   Output buffer that will receive the null-terminated string.
 *
 * @param[in]  bufferSize
 *   Size of the output buffer in bytes, including space for the null terminator.
 *
 * @param[in]  precision
 *   Number of digits after the decimal point (0–4).
 *   Values greater than 4 will be clamped to 4.
 *
 * @return
 *    0 - success
 *   -1 - invalid buffer or encoding error
 *   -2 - snprintf error
 *   >0 - error or insufficient buffer size:
 *        n>0 -> required buffer size (excluding null terminator) if buffer is too small
 *
 * @note
 *   The function uses snprintf(), which returns the number of characters that
 *   would have been written (excluding the null terminator). If this value is
 *   greater than or equal to bufferSize, the output was truncated.
 */
int grdd_unit_to_string(grdd_unit u, char* buffer, size_t bufferSize, uint8_t precision);

grdd_unit grdd_unit_calculate_decay(grdd_unit u, grdd_duration_seconds duration);


#ifdef __cplusplus
}
#endif


#endif // GRADIDO_BLOCKCHAIN_C_DATA_UNIT_H