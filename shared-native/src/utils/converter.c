#include "gradido_blockchain_core/utils/converter.h"

/**
 * @brief Compute the number of decimal digits of a uint64_t value.
 *
 * This function returns the length of the decimal representation of `v`
 * without converting it to a string.
 *
 * Implementation details:
 * - Uses a fully unrolled decision tree of comparisons against powers of 10.
 * - Avoids loops, divisions, and memory lookups.
 * - Runs in O(1) time with a small, fixed number of branches.
 *
 * Rationale:
 * - A naive implementation (e.g., repeated division by 10 or scanning a powers[] array)
 *   introduces loops, branch dependencies, and potential cache access.
 * - This version minimizes branch depth and allows the CPU branch predictor
 *   to perform efficiently, making it faster in hot paths.
 *
 * Range:
 * - Supports full uint64_t range [0, UINT64_MAX].
 * - Maximum return value is 19 (since UINT64_MAX < 10^20).
 *
 * Notes:
 * - The structure may look unusual, but it is intentionally optimized for performance.
 * - Any modification should preserve the exact boundary conditions (powers of 10),
 *   otherwise subtle off-by-one errors may occur.
 */
size_t grdu_uint64_to_string_size(uint64_t v)
{
    if (v < 100000000ULL) {
        if (v < 10000ULL) {
            if (v < 100ULL) return v < 10 ? 1 : 2;
            return v < 1000ULL ? 3 : 4;
        }
        if (v < 1000000ULL) {
            return v < 100000ULL ? 5 : 6;
        }
        return v < 10000000ULL ? 7 : 8;
    }

    if (v < 1000000000000ULL) {
        if (v < 10000000000ULL) {
            return v < 1000000000ULL ? 9 : 10;
        }
        return v < 100000000000ULL ? 11 : 12;
    }

    if (v < 10000000000000000ULL) {
        if (v < 100000000000000ULL) {
            return v < 10000000000000ULL ? 13 : 14;
        }
        return v < 1000000000000000ULL ? 15 : 16;
    }

    return v < 100000000000000000ULL ? 17 : (v < 1000000000000000000ULL ? 18 : 19);
}

size_t grdu_uint64_to_string_known_string_size(char* buffer, uint64_t value, size_t stringSize)
{
    if (value == 0) {
        if (stringSize < 1) {
            return 1; // return required size without null terminator
        }
        buffer[0] = '0';
        buffer[1] = '\0';
        return 1;
    }
    uint64_t temp = value;
    int len = stringSize;
    int cursor = len;
    buffer[cursor] = '\0';

    static const char DIGIT_TABLE[201] =
        "00010203040506070809"
        "10111213141516171819"
        "20212223242526272829"
        "30313233343536373839"
        "40414243444546474849"
        "50515253545556575859"
        "60616263646566676869"
        "70717273747576777879"
        "80818283848586878889"
        "90919293949596979899";

    // process 2 digits at a time
    while (temp >= 100)
    {
        if (cursor < 2) {
            return grdu_uint64_to_string_size(value); // return required size without null terminator
        }
        uint64_t q = temp / 100;
        uint64_t r = temp - q * 100;
        buffer[--cursor] = DIGIT_TABLE[r * 2 + 1];
        buffer[--cursor] = DIGIT_TABLE[r * 2];
        temp = q;
    }

    // last 1 or 2 digits
    if (temp < 10)
    {
        if (cursor < 1) {
            return grdu_uint64_to_string_size(value); // return required size without null terminator
        }
        buffer[--cursor] = '0' + (char)temp;
    }
    else
    {
        if (cursor < 2) {
            return grdu_uint64_to_string_size(value); // return required size without null terminator
        }
        buffer[--cursor] = DIGIT_TABLE[temp * 2 + 1];
        buffer[--cursor] = DIGIT_TABLE[temp * 2];
    }
    return len; // return number of characters written, not counting null terminator
}

// for easy use, one call

size_t grdu_uint64_to_string(char* buffer, size_t bufferSize, uint64_t value)
{
    size_t requiredSize = grdu_uint64_to_string_size(value);
    if (bufferSize < requiredSize + 1) 
    {
        // better safe then sorry
        if (bufferSize) {
            buffer[0] = '\0';
        }
        return requiredSize; // return required size without null terminator
    }
    return grdu_uint64_to_string_known_string_size(buffer, value, requiredSize);
}
