/*!
*
* \author: einhornimmond
*
* \date: 08.03.19
*
* \brief: easy to use time profiler
*/

#ifndef DR_LUA_WEB_MODULE_CORE_LIB_PROFILER_H
#define DR_LUA_WEB_MODULE_CORE_LIB_PROFILER_H

#include <chrono>
#include <string>

class Profiler
{
public:
	Profiler();
	Profiler(const Profiler& copy);
	~Profiler();

	inline void reset() { mStartTick = std::chrono::high_resolution_clock::now(); }
	double millis() const;
	double micros() const;
	double nanos() const;
	double seconds() const;
	std::string string() const;

protected:
	std::chrono::time_point<std::chrono::high_resolution_clock> mStartTick;
};

#endif //DR_LUA_WEB_MODULE_CORE_LIB_PROFILER_H
