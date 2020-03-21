#include "DataTypeConverter.h"

namespace DataTypeConverter
{
	NumberParseState strToInt(const std::string& input, int& result)
	{
		try {
			result = stoi(input);
			return NUMBER_PARSE_OKAY;
		}
		catch (const std::invalid_argument& ia) 
		{
			printf("[strToInt] exception: invalid argument: %s\n", ia.what());
			return NUMBER_PARSE_INVALID_ARGUMENT;
		}
		catch (const std::out_of_range& oor) 
		{
			printf("[strToInt] exception: out or range: %s\n", oor.what());
			return NUMBER_PARSE_OUT_OF_RANGE;
		}
		catch (const std::logic_error & ler) 
		{
			printf("[strToInt] exception: logical error: %s\n", ler.what());
			return NUMBER_PARSE_LOGIC_ERROR;
		}
	}

	const char* numberParseStateToString(NumberParseState state)
	{
		switch (state) {
		case NUMBER_PARSE_OKAY: return "okay";
		case NUMBER_PARSE_INVALID_ARGUMENT: return "invalid argument";
		case NUMBER_PARSE_OUT_OF_RANGE: return "out of range";
		case NUMBER_PARSE_LOGIC_ERROR: return "logical error";
		}
		return "<unknown>";
	}
}