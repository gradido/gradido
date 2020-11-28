#include "DecayRate.h"

#include <gmp.h>
#include <mpfr.h>

DecayRate::DecayRate()
	: mDecayRate(0.0)
{

}

DecayRate::~DecayRate()
{

}

void DecayRate::calculateDecayRate(int daysPerYear/* = 356*/, Profiler* time/* = nullptr*/)
{
	
	mpfr_t capital_n_log; mpfr_init(capital_n_log);
	mpfr_t capital_0_log; mpfr_init(capital_0_log);
	mpfr_t capital_diff; mpfr_init(capital_diff);
	mpfr_t decay_rate_per_second; mpfr_init(decay_rate_per_second);
	mpfr_t seconds_per_year;
	mpfr_t days_per_year;
	mpfr_init_set_ui(days_per_year, daysPerYear, MPFR_RNDN);
	mpfr_init(seconds_per_year);
	/*
	typedef enum {
	MPFR_RNDN=0,  // round to nearest, with ties to even 
	MPFR_RNDZ,    // round toward zero 
		MPFR_RNDU,    // round toward +Inf 
		MPFR_RNDD,    // round toward -Inf 
		MPFR_RNDA,    // round away from zero 
		MPFR_RNDF,    // faithful rounding 
		MPFR_RNDNA = -1 // round to nearest, with ties away from zero (mpfr_round) 
} mpfr_rnd_t;

	*/
	//mpfr_rnd_t
	// seconds per year = 60*60*24*daysPerYear
	mpfr_mul_ui(seconds_per_year, days_per_year, 60 * 60 * 24, MPFR_RNDN);

	mpfr_log_ui(capital_n_log, 50, MPFR_RNDN);
	mpfr_log_ui(capital_0_log, 100, MPFR_RNDN);
	mpfr_sub(capital_diff, capital_n_log, capital_0_log, MPFR_RNDN);
	mpfr_div(decay_rate_per_second, capital_diff, seconds_per_year, MPFR_RNDN);
	mDecayRate = mpfr_get_d(decay_rate_per_second, MPFR_RNDN);
}