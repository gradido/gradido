#ifndef GRADIDO_BLOCKCHAIN_CORE_UTILS_MONO_TIMER_H
#define GRADIDO_BLOCKCHAIN_CORE_UTILS_MONO_TIMER_H

#include <stdbool.h>
#include <stdint.h>
#include <time.h>

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup utils Utilities */

/**
 * @defgroup grdu_mono_timer grdu_mono_timer
 * @ingroup utils
 * @brief High-resolution monotonic timer for precise time measurements.
 * Provides a simple interface to capture a reference time and measure elapsed time in various units
 * (seconds, milliseconds, microseconds, nanoseconds). Uses platform-specific high-resolution
 * monotonic clocks:
 * - Windows: QueryPerformanceCounter
 * - Unix-like: CLOCK_MONOTONIC
 * @note On Windows, grdu_mono_timer_init must be called before using timers in multi-threaded
 * applications.
 * @whisper Time flows steadily — captured and measured with precision
 *
 * @{
 */

typedef int64_t grdu_mono_timer;

/**
 * @brief Initialize monotonic timer infrastructure (Only on Windows necessary).
 *
 * On Windows, initializes performance counter frequency for high-resolution timing.
 * On other platforms (Linux, macOS), this is a no-op — they use CLOCK_MONOTONIC directly.
 *
 * Safe to call multiple times but not threadsafe. Must be called before using timers in
 * multi-threaded
 *
 * @return
 *   true  - initialization successful (or already initialized)
 *   false - Windows QueryPerformanceFrequency failed (extremely rare)
 *
 * @whisper The clock awakens — infrastructure settles into place
 */
bool grdu_mono_timer_init();

/**
 * @brief Capture the current monotonic time and store it for later measurement.
 *
 * Records a reference point that will be used by subsequent calls to measure elapsed time.
 * Can be called multiple times on the same timer variable to reset the measurement.
 * Uses platform-specific high-resolution monotonic clocks:
 * - Windows: QueryPerformanceCounter
 * - Unix-like: CLOCK_MONOTONIC
 *
 * @param[out] start  Pointer to timer to receive current time (must not be NULL).
 *
 * @whisper Time is captured — the baseline is set
 */
void grdu_mono_timer_reset(grdu_mono_timer *start);

/**
 * @brief Measure elapsed time in seconds since the timer was reset.
 *
 * @param[in] start  Reference time from grdu_mono_timer_reset.
 *
 * @return Elapsed seconds as a double-precision floating-point number.
 */
double grdu_mono_timer_seconds(grdu_mono_timer start);

/**
 * @brief Measure elapsed time in milliseconds since the timer was reset.
 *
 * @param[in] start  Reference time from grdu_mono_timer_reset.
 *
 * @return Elapsed milliseconds as a double-precision floating-point number.
 */
double grdu_mono_timer_millis(grdu_mono_timer start);

/**
 * @brief Measure elapsed time in microseconds since the timer was reset.
 *
 * @param[in] start  Reference time from grdu_mono_timer_reset.
 *
 * @return Elapsed microseconds as a double-precision floating-point number.
 */
double grdu_mono_timer_micros(grdu_mono_timer start);

/**
 * @brief Measure elapsed time in nanoseconds since the timer was reset.
 *
 * Raw nanosecond precision without floating-point conversion.
 * This is the foundation for all other time measurements.
 *
 * @param[in] start  Reference time from grdu_mono_timer_reset.
 *
 * @return Elapsed nanoseconds as a 64-bit integer.
 */
int64_t grdu_mono_timer_nanos(grdu_mono_timer start);

/**
 * @brief Format elapsed time as a human-readable string with automatic unit selection.
 *
 * Converts the time since reset into a readable format, choosing the most appropriate
 * unit (ns, us, ms, s, min, h, or days). Uses 4 decimal places of precision.
 *
 * Writes into the provided buffer only if sufficient space is available.
 *
 * @param[out] buffer      Destination buffer for the resulting string.
 * @param[in]  buffer_size Size of buffer in bytes (must include space for '\0').
 * @param[in]  start       Reference time from grdu_mono_timer_reset.
 *
 * @return
 *   >= 0  - Characters written (excluding '\0'). If buffer is too small,
 *           returns the size that would have been needed.
 *   -1    - Invalid input.
 *
 * @note Uses grdu_duration_string internally for unit selection.
 *
 * @whisper Time becomes words — durations flow into readability
 */
int grdu_mono_timer_string(char *buffer, size_t buffer_size, grdu_mono_timer start);

/**
 * @}
 */

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_UTILS_MONO_TIMER_H