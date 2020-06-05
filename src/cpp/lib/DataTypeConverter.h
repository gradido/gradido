#ifndef __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H
#define __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H

#include <string>
#include "../SingletonManager/MemoryManager.h"

namespace DataTypeConverter {

	enum NumberParseState
	{
		NUMBER_PARSE_OKAY = 0,
		NUMBER_PARSE_INVALID_ARGUMENT,
		NUMBER_PARSE_OUT_OF_RANGE,
		NUMBER_PARSE_LOGIC_ERROR
	};

	NumberParseState strToInt(const std::string& input, int& result);

	MemoryBin* hexToBin(const std::string& hexString);
	MemoryBin* base64ToBin(const std::string& base64String);

	std::string binToBase64(const MemoryBin* data);
	std::string binToHex(const MemoryBin* data);
	//! \param pubkey pointer to array with crypto_sign_PUBLICKEYBYTES size
	std::string pubkeyToHex(const unsigned char* pubkey);


	const char* numberParseStateToString(NumberParseState state);
};

#endif // __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H
