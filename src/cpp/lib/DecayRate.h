#ifndef __GRADIDO_LOGIN_SERVER_LIB_INTEREST_RATE_H
#define __GRADIDO_LOGIN_SERVER_LIB_INTEREST_RATE_H

/*!
 * @author: Dario Rekowski
 * 
 * @date: 2020-11-24 
 *
 * @brief: to calculate interest rate for gradido and maybe also decay
*/

#include "Poco/Types.h"
#include "Profiler.h"

class DecayRate
{
public:
	DecayRate();
	~DecayRate();

	void calculateDecayRate(int daysPerYear = 356, Profiler* time = nullptr);
	inline double getDecayRate() { return mDecayRate; }

protected:
	double mDecayRate;
};

#endif //__GRADIDO_LOGIN_SERVER_LIB_INTEREST_RATE_H