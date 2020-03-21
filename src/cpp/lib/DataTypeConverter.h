#ifndef __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H
#define __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H

#include <string>

namespace DataTypeConverter {

	enum NumberParseState
	{
		NUMBER_PARSE_OKAY = 0,
		NUMBER_PARSE_INVALID_ARGUMENT,
		NUMBER_PARSE_OUT_OF_RANGE,
		NUMBER_PARSE_LOGIC_ERROR
	};

	NumberParseState strToInt(const std::string& input, int& result);

	const char* numberParseStateToString(NumberParseState state);
};

#endif // __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H
