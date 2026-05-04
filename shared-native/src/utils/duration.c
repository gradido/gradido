#include "gradido_blockchain_core/utils/duration.h"
#include "gradido_blockchain_core/utils/converter.h"

#include <string.h>
#include <stdio.h>

int grdu_duration_string(char* buffer, size_t buffer_size, grdu_duration duration, uint8_t precision)
{
    uint64_t ns = (uint64_t)duration;

    uint64_t divisor;
    const char* suffix;

    if (duration < 0) {
        return -1; // negative durations are not supported
    }
    if (precision > 15) {
        precision = 15; // limit precision to 15 to avoid overflow in fractional part
    }

    // --- unit selection (branch tree, kein array) ---
    if (ns < 1000ULL) {
        divisor = 1ULL;
        suffix = " ns";
    } else if (ns < 1000000ULL) {
        divisor = 1000ULL;
        suffix = " us";
    } else if (ns < 1000000000ULL) {
        divisor = 1000000ULL;
        suffix = " ms";
    } else if (ns < 60000000000ULL) {
        divisor = 1000000000ULL;
        suffix = " s";
    } else if (ns < 3600000000000ULL) {
        divisor = 60ULL * 1000000000ULL;
        suffix = " min";
    } else if (ns < 86400000000000ULL) {
        divisor = 60ULL * 60ULL * 1000000000ULL;
        suffix = " h";
    } else {
        divisor = 24ULL * 60ULL * 60ULL * 1000000000ULL;
        suffix = " days";
    }

    double decimalValue = (double)ns / divisor;
    int64_t integerPart = (int64_t)decimalValue;
    int64_t fractionalPart = (int64_t)((decimalValue - integerPart) * 1000000000000000ULL);

    size_t int_size = grdu_uint64_to_string_size(integerPart);
    size_t suffix_len = strlen(suffix);
    if (buffer_size < int_size + 2 + precision + suffix_len) {// +2 for possible '-' and '.' and +precision for fractional part
        return int_size + 1 + precision + suffix_len; // return required size without null terminator
    }

    size_t written = grdu_uint64_to_string_known_string_size(buffer, integerPart, int_size);
    // --- fractional part ---
    if (precision > 0 && divisor > 1)
    {
        buffer[written++] = '.';
        size_t fractionalPartSize = 0;
        if (fractionalPart) {
            fractionalPartSize = grdu_uint64_to_string_size(fractionalPart);
        }
        // 15 = max fractional part size (15 zeros near the double boundary)
        size_t zerosBeforeCount = 15 - fractionalPartSize;
        if (zerosBeforeCount > precision) {
            zerosBeforeCount = precision;
        }
        if (zerosBeforeCount > 0) {
            memset(buffer + written, '0', zerosBeforeCount);
            written += zerosBeforeCount;
        }
        size_t restNumbers = precision - zerosBeforeCount;
        if (restNumbers) {
            char tempBuffer[20]; // enough to hold fractional part
            size_t frac_size = grdu_uint64_to_string_known_string_size(tempBuffer, fractionalPart, fractionalPartSize);
            memcpy(buffer + written, tempBuffer, restNumbers);
            written += restNumbers;
        }
    }

    // --- suffix ---
    memcpy(buffer + written, suffix, suffix_len);
    written += suffix_len;

    buffer[written] = '\0';
    return written;
}