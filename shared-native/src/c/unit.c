#include "unit.h"

#include <math.h>
#include <stdio.h>
#include <stdlib.h>

const grdd_duration_seconds SECONDS_PER_YEAR = 31556952; // seconds in a year in gregorian calender
const grdd_timestamp_seconds DECAY_START_TIME = 1620927991;

double roundToPrecision(double gdd, uint8_t precision) 
{
	// replace pow(10, precision) with lookup table
	static const double factors[] = {1.0, 10.0, 100.0, 1000.0, 10000.0};

	if (precision > 4) {
		precision = 4;
	}

	double factor = factors[precision];
	return round(gdd * factor) / factor;
}

grdd_unit grdd_unit_from_decimal(double gdd)
{
  return (grdd_unit)(roundToPrecision(gdd, 4) * 10000.0);
}

double grdd_unit_to_decimal(grdd_unit u)
{
	return (double)u / 10000.0;
}

bool grdd_unit_from_string(const char* gdd_string, grdd_unit* resultGdd)
{
  if (!gdd_string) return false;
  char* end;
  double gdd_double = strtod(gdd_string, &end);
  if (end == gdd_string || *end != '\0') {
    // invalid string 
    return false;
  }
  if (resultGdd) {
    *resultGdd = grdd_unit_from_decimal(gdd_double);
  } 
  return true;
}

int grdd_unit_to_string(grdd_unit u, char* buffer, size_t bufferSize, uint8_t precision)
{
  if (precision > 4) return 1; // C hasn't exceptions

  // Convert to double
  double decimal = (double)(u) / 10000.0;

  if (precision < 4) {
    decimal = roundToPrecision(decimal, precision);
  }

  // Write to buffer
  int written = snprintf(buffer, bufferSize, "%.*f", precision, decimal);

  // snprintf returns number of chars that would have been written (excluding null)
  // snprintf return negative value on encoding error
  if (written < 0) return 2;
  if ((size_t)written < bufferSize) {
    return 0;
  }
  return bufferSize - written;
}

grdd_timestamp_seconds get_decay_start_time()
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
