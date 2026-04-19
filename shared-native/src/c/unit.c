#include "unit.h"
#include "utils.h"

#include <ctype.h>
#include <math.h>
#include <memory.h>
#include <stdio.h>
#include <stdlib.h>

const grdd_duration_seconds SECONDS_PER_YEAR = 31556952; // seconds in a year in gregorian calender
const grdd_timestamp_seconds DECAY_START_TIME = 1620927991;
static const int64_t POW10[] = {1, 10, 100, 1000, 10000};

static double round_to_precision(double gdd, uint8_t precision) 
{
	if (precision > 4) {
		precision = 4;
	}

	double factor = POW10[precision];
	return round(gdd * factor) / factor;
}

bool grdd_unit_round_to_precision(grdd_unit value, uint8_t precision, grdd_unit* result)
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
	if (rounded > 9223372036854775807u) {
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

bool grdd_unit_from_string(const char* str, grdd_unit* out)
{
    if (!str || !out) return false;

    const char* p = str;

    bool negative = false;

    if (*p == '-') {
    	negative = true;
			++p;
    } 

    // --- integer part ---
    char* end;
    int64_t integerPart = strtoll(p, &end, 10);
    if (end == p && *p != '.') return false;

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

    if (*p != '\0') return false;
		// int64 max:  9,223,372,036,854,775,807
		// int64 min: -9,223,372,036,854,775,807
		// int64 max for integer part (without fractional part): 922,337,203,685,476
    if (integerPart > 922337203685476 || integerPart < -922337203685476) return false;

		int64_t result = 0;
		if (negative) {
			integerPart *= -1;
			fractionalPart *= -1;
		}
		result = integerPart * 10000 + fractionalPart;

    *out = result;
    return true;
}

int grdd_unit_to_string(grdd_unit u, char* buffer, uint8_t precision)
{
	if (precision > 4) precision = 4;

	grdd_unit rounded = 0;
	if (!grdd_unit_round_to_precision(u, precision, &rounded)) {
		return -1;
	}

	bool negative = rounded < 0;

	size_t cursor = 0;

	if (negative) {
		rounded *= -1;
		buffer[cursor++] = '-';
	}
	if (!precision) {
		int64_t integerPart = rounded / 10000;
		cursor += grdu_uint64ToString(integerPart, &buffer[cursor]);
		return cursor;
	}
	
	size_t numberPlacesCount = grdu_uint64ToString(rounded, &buffer[cursor]);
	// pad with 0
	if (numberPlacesCount < 5) {
		size_t paddingCount = 5 - numberPlacesCount;
		memmove(&buffer[paddingCount + cursor], &buffer[cursor], numberPlacesCount);
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

grdd_unit grdd_unit_calculate_decay(grdd_unit u, grdd_duration_seconds duration)
{
  if (duration == 0) return u;
	
	// decay for one year is 50%
	/*
	* while (seconds >= SECONDS_PER_YEAR) {
		mGradidoCent *= 0.5;
		seconds -= SECONDS_PER_YEAR;
	}
	*/
	grdd_unit gradidoCent = u;
	// optimizing with bit shift for whole years
	if (duration >= SECONDS_PER_YEAR) {
		uint64_t times = (uint64_t)(duration / SECONDS_PER_YEAR);
		if (times > 63) {
				// after more than 63 years, all gradidos are decayed
				return 0;
		}
		duration = duration - times * SECONDS_PER_YEAR;
		gradidoCent = u >> times;
		if (!duration) return gradidoCent;
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
	return (grdd_unit)((double)gradidoCent * pow(2.0, (double)-duration / (double)SECONDS_PER_YEAR));
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
