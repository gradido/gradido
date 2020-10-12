#ifndef __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H
#define __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H

#include <string>
#include "../SingletonManager/MemoryManager.h"

#include "Poco/Timespan.h"
#include "Poco/Nullable.h"
#include "Poco/Data/LOB.h"
#include "../SingletonManager/LanguageManager.h"

#include "../proto/hedera/Timestamp.pb.h"
#include "../proto/hedera/Duration.pb.h"

#include "sodium.h"

namespace DataTypeConverter {

	enum NumberParseState
	{
		NUMBER_PARSE_OKAY = 0,
		NUMBER_PARSE_INVALID_ARGUMENT,
		NUMBER_PARSE_OUT_OF_RANGE,
		NUMBER_PARSE_LOGIC_ERROR
	};

	NumberParseState strToInt(const std::string& input, int& result);
	NumberParseState strToInt(const std::string& input, unsigned long long& result);
	NumberParseState strToDouble(const std::string& input, double& result);

	MemoryBin* hexToBin(const std::string& hexString);
	MemoryBin* base64ToBin(const std::string& base64String, int variant = sodium_base64_VARIANT_ORIGINAL);

	
	std::string binToBase64(const unsigned char* data, size_t size, int variant = sodium_base64_VARIANT_ORIGINAL);
	inline std::string binToBase64(const MemoryBin* data, int variant = sodium_base64_VARIANT_ORIGINAL) { return binToBase64(data->data(), data->size(), variant); }
	
	std::string binToHex(const unsigned char* data, size_t size);
	std::string binToHex(const Poco::Nullable<Poco::Data::BLOB>& nullableBin);
	inline std::string binToHex(const MemoryBin* data) { return binToHex(data->data(), data->size());}
	inline std::string binToHex(const std::vector<unsigned char>& data) { return binToHex(data.data(), data.size()); }

	//! \param pubkey pointer to array with crypto_sign_PUBLICKEYBYTES size
	std::string pubkeyToHex(const unsigned char* pubkey);


	const char* numberParseStateToString(NumberParseState state);

	//! \brief convert duration in string showing seconds, minutes, hours or days
	std::string convertTimespanToLocalizedString(Poco::Timespan duration, LanguageCatalog* lang);

	Poco::Timestamp convertFromProtoTimestamp(const proto::Timestamp& timestamp);
	Poco::Timespan  convertFromProtoDuration(const proto::Duration& duration);
};

#endif // __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H
