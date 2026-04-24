#include "gradido_blockchain_core/data/unit.h"
#include "gradido_blockchain_core/utils/converter.h"

#define R128_IMPLEMENTATION
#include "r128/r128.h"

#include <ctype.h>
#include <math.h>
#include <memory.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

static const grdd_duration_seconds SECONDS_PER_YEAR = 31556952; // seconds in a year in gregorian calender
static const grdd_timestamp_seconds DECAY_START_TIME = 1620927991;
// precalculated decay factor for deterministic decay calculation across platforms, 2^64 / SECONDS_PER_YEAR
// static const uint64_t DECAY_FACTOR_PER_SECOND =   18446743668527564941ULL; // TypeScript Decimal.js
static const uint64_t DECAY_FACTOR_PER_SECOND =   18446743668527564940ULL;
static const uint64_t GROW_FACTOR_PER_SECOND =    405181995575ULL; // for low, and 1 for hi

// precalculated powers of 10 for fast rounding
static const uint64_t POW10[] = { 1, 10, 100, 1000, 10000 };

static double round_to_precision(double gdd, uint8_t precision)
{
	if (precision > 4) {
		precision = 4;
	}

	double factor = POW10[precision];
	return round(gdd * factor) / factor;
}

bool grdd_unit_round_to_precision(grdd_unit* result, grdd_unit value, uint8_t precision)
{
	if (!result || precision > 4) {
		return false;
	}
	if (precision == 4) {
		*result = value;
		return true;
	}

	int shift = 4 - precision;
	uint64_t divisor = POW10[shift];

	// half-up rounding
	uint64_t half = divisor / 2;
	uint64_t rounded = 0;
	uint64_t gdd = value;
	if (value < 0) {
		gdd = -value;
	}
	rounded = ((gdd + half) / divisor) * divisor;
	if (rounded > INT64_MAX) {
		return false;
	}
	if (value < 0) {
		*result = -rounded;
	} else {
		*result = rounded;
	}
	return true;
}

grdd_unit grdd_unit_from_decimal(double gdd)
{
  return (grdd_unit)(round_to_precision(gdd, 4) * 10000.0);
}

double grdd_unit_to_decimal(grdd_unit u)
{
	return (double)u / 10000.0;
}

bool grdd_unit_from_string(grdd_unit* resultGdd, const char* gdd_string)
{
    if (!gdd_string || !resultGdd) {
			return false;
		}

    const char* p = gdd_string;
    bool negative = false;

    if (*p == '-') {
			negative = true;
			++p;
    }

    // --- integer part ---
    char* end;
    int64_t integerPart = strtoll(p, &end, 10);
    if (end == p && *p != '.') {
			return false;
		}

    int64_t fractionalPart = 0;
    int digits = 0;

    p = end;

    // --- fractional part ---
    if (*p == '.') {
        ++p;

        // first 4 digits
        while (isdigit(*p) && digits < 4) {
            fractionalPart = fractionalPart * 10 + (*p - '0');
            ++p;
            ++digits;
        }

        // pad with zeros
        while (digits < 4) {
            fractionalPart *= 10;
            ++digits;
        }

        // --- rounding digit (5th) ---
        if (isdigit(*p)) {
            int roundDigit = *p - '0';

            if (roundDigit >= 5) {
                fractionalPart += 1;

                // handle carry (e.g. 0.99995 -> 1.0000)
                if (fractionalPart >= 10000) {
                    fractionalPart = 0;
                    integerPart += 1;
                }
            }

            // skip remaining digits
            while (isdigit(*p)) ++p;
        }
    }

    if (*p != '\0') {
			return false;
		}
		// int64 max:  9,223,372,036,854,775,807
		// int64 min: -9,223,372,036,854,775,807
		// int64 max for integer part (without fractional part): 922,337,203,685,476
    if (integerPart > 922337203685476 || integerPart < -922337203685476) {
			return false;
		}

		int64_t result = 0;
		if (negative) {
			integerPart *= -1;
			fractionalPart *= -1;
		}
		result = integerPart * 10000 + fractionalPart;

    *resultGdd = result;
    return true;
}

int grdd_unit_to_string(char* buffer, size_t bufferSize, grdd_unit value, uint8_t precision)
{
	if (!buffer || bufferSize == 0) {
		return -1;
	}
	if (precision > 4) precision = 4;

	grdd_unit rounded = 0;
	if (!grdd_unit_round_to_precision(&rounded, value, precision)) {
		return -2;
	}

	bool negative = rounded < 0;

	size_t cursor = 0;

	if (negative) {
		rounded *= -1;
		buffer[cursor++] = '-';
	}
	if (!precision) {
		int64_t integerPart = rounded / 10000;
		size_t integerPartStringSize = grdu_uint64_to_string_size(integerPart);
		if (bufferSize < cursor + integerPartStringSize + 1) {
			return cursor + integerPartStringSize; // return required size without null terminator
		}
		cursor += grdu_uint64_to_string_known_string_size(&buffer[cursor], integerPart, integerPartStringSize);
		return cursor;
	}
	size_t numberPlacesCount = grdu_uint64_to_string_size(rounded);
	if (numberPlacesCount < 5 && bufferSize < cursor + 7) {
		return cursor + 6; // return required size without null terminator
	}
	if (bufferSize < cursor + numberPlacesCount + 2) {
		return cursor + numberPlacesCount + 1; // return required size without null terminator
	}
	size_t stringSize = grdu_uint64_to_string_known_string_size(&buffer[cursor], rounded, numberPlacesCount);
	if (numberPlacesCount != stringSize) {
		return -3; // this should never happen, but just in case
	}
	// pad with 0
	if (numberPlacesCount < 5) {
		size_t paddingCount = 5 - numberPlacesCount;
		memmove(&buffer[paddingCount + cursor], &buffer[cursor], numberPlacesCount + 1);
		memset(&buffer[cursor], '0', paddingCount);
		cursor += paddingCount;
	}
	cursor += numberPlacesCount;
	// make room for .
	memmove(&buffer[cursor - 3], &buffer[cursor - 4], 5);
	cursor++;
	buffer[cursor - 5] = '.';

	if (precision != 4) {
		cursor -= 4 - precision;
		buffer[cursor] = '\0';
	}
	return cursor;
}

grdd_timestamp_seconds grdd_unit_decay_start_time()
{
	return DECAY_START_TIME;
}

grdd_unit grdd_unit_calculate_decay(grdd_unit gdd, grdd_duration_seconds duration)
{
  if (duration == 0) {
		return gdd;
	}

	// decay for one year is 50%
	/*
	* while (seconds >= SECONDS_PER_YEAR) {
		mGradidoCent *= 0.5;
		seconds -= SECONDS_PER_YEAR;
	}
	*/
	grdd_unit gdd_temp;

	// optimizing with bit shift for whole years
	if (duration >= SECONDS_PER_YEAR) {
		uint64_t times = (uint64_t)(duration / SECONDS_PER_YEAR);
		if (times > 63) {
				// after more than 63 years, all gradidos are decayed
				return 0;
		}
		duration = duration - times * SECONDS_PER_YEAR;
		gdd_temp =  gdd >> times; // equivalent to gdd / (2^times)
		if (!duration) {
			return gdd_temp;
		}
	} else {
		gdd_temp = gdd;
	}

	/*!
	 *  calculate decay factor with compound interest formula converted to q <br>
	 *  n = (lg Kn - lg K0) / lg q => <br>
	 *  lg q = (lg Kn - lg K0) / n => <br>
	 *  q = e^((lg Kn - lg K0) / n)   <br>
	 * <br>
	 * with:
	 * <ul>
	 *  <li>q = decay_factor</li>
	 *  <li>n = days_per_year * 60 * 60 * 24 = seconds per year</li>
	 *  <li>Kn = 50 (capital after a year)</li>
	 *  <li>K0 = 100 (capital at start)</li>
	 * </ul>
	 * further simplified:
	 * lg 50 - lg 100 = lg 2 =>
	 * q = e^(lg 2 / n) = 2^(x/n)
	 * with x as seconds in which decay occured
	 */
	// https://www.wolframalpha.com/input?i=%28e%5E%28lg%282%29+%2F+31556952%29%29%5Ex&assumption=%7B%22FunClash%22%2C+%22lg%22%7D+-%3E+%7B%22Log%22%7D
	// from wolframalpha, based on the interest rate formula
	//return (grdd_unit)((double)gradidoCent * pow(2.0, (double)-duration / (double)SECONDS_PER_YEAR));

	R128 factor = { .lo = 0, .hi = 1 };
	R128 base = { .lo = DECAY_FACTOR_PER_SECOND, .hi = 0 };
	bool negative = false;
	uint64_t exp = duration;

	if (duration < 0) {
		negative = true;
		exp = -duration;
		base.lo = GROW_FACTOR_PER_SECOND;
		base.hi = 1;
	}

	while (exp > 0) {
			if ((exp & 1) == 1) {
					r128Mul(&factor, &factor, &base);  // factor *= base
			}
			r128Mul(&base, &base, &base);        // base *= base
			exp >>= 1;
	}
	R128 gdd128;
	r128FromInt(&gdd128, gdd_temp);
	// Final: balance * factor
	r128Mul(&gdd128, &gdd128, &factor);
	r128Round(&gdd128, &gdd128); // round to nearest integer
	grdd_unit decayed = r128ToInt(&gdd128);
	if (negative && gdd > 0 && decayed < 0) {
		// sign flip/overflow detected
		decayed = INT64_MAX;
	}
	return decayed;
}

bool grdd_unit_calculate_duration_seconds(grdd_timestamp_seconds startTime, grdd_timestamp_seconds endTime, grdd_duration_seconds* outSeconds)
{
	if (!outSeconds) {
		return false;
	}
  if(startTime > endTime) {
		return false;
	}
	grdd_timestamp_seconds start = startTime >  DECAY_START_TIME ? startTime : DECAY_START_TIME;
	grdd_timestamp_seconds end = endTime > DECAY_START_TIME ? endTime : DECAY_START_TIME;
  if (outSeconds) {
    if (start == end) {
      *outSeconds = 0;
    } else {
      *outSeconds = end - start;
    }
  }
	return true;
}
