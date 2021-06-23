#ifndef __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H
#define __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H

#include <string>
#include "../SingletonManager/MemoryManager.h"

#include "Poco/Timespan.h"
#include "Poco/Nullable.h"
#include "Poco/Data/LOB.h"
#include "Poco/JSON/Object.h"
#include "Poco/JSON/Array.h"
#include "../SingletonManager/LanguageManager.h"

#include "proto/gradido/BasicTypes.pb.h"

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
#ifdef __linux__
	NumberParseState strToInt(const std::string& input, unsigned long long& result);
#endif
	NumberParseState strToInt(const std::string& input, Poco::UInt64& result);
	NumberParseState strToDouble(const std::string& input, double& result);

	MemoryBin* hexToBin(const std::string& hexString);
	MemoryBin* base64ToBin(const std::string& base64String, int variant = sodium_base64_VARIANT_ORIGINAL);


	std::string binToBase64(const unsigned char* data, size_t size, int variant = sodium_base64_VARIANT_ORIGINAL);
	inline std::string binToBase64(const MemoryBin* data, int variant = sodium_base64_VARIANT_ORIGINAL) { return binToBase64(data->data(), data->size(), variant); }
	inline std::string binToBase64(const std::string& proto_bin, int variant = sodium_base64_VARIANT_ORIGINAL) {
		return binToBase64((const unsigned char*)proto_bin.data(), proto_bin.size(), variant);
	}

	std::string binToHex(const unsigned char* data, size_t size);
	std::string binToHex(const Poco::Nullable<Poco::Data::BLOB>& nullableBin);
	inline std::string binToHex(const MemoryBin* data) { return binToHex(data->data(), data->size());}
	inline std::string binToHex(const std::vector<unsigned char>& data) { return binToHex(data.data(), data.size()); }

	//! \param pubkey pointer to array with crypto_sign_PUBLICKEYBYTES size
	std::string pubkeyToHex(const unsigned char* pubkey);


	const char* numberParseStateToString(NumberParseState state);

	//! \brief convert duration in string showing seconds, minutes, hours or days
	std::string convertTimespanToLocalizedString(Poco::Timespan duration, LanguageCatalog* lang);

	Poco::Timestamp convertFromProtoTimestamp(const proto::gradido::Timestamp& timestamp);
	void convertToProtoTimestamp(const Poco::Timestamp pocoTimestamp, proto::gradido::Timestamp* protoTimestamp);
	Poco::Timestamp convertFromProtoTimestampSeconds(const proto::gradido::TimestampSeconds& timestampSeconds);
	inline void convertToProtoTimestampSeconds(const Poco::Timestamp pocoTimestamp, proto::gradido::TimestampSeconds* protoTimestampSeconds) {
		protoTimestampSeconds->set_seconds(pocoTimestamp.epochTime());
	}

	//! \brief go through json object and replace every string entry in base64 format into hex format
	//! \return count of replaced strings
	int replaceBase64WithHex(Poco::JSON::Object::Ptr json);
	int replaceBase64WithHex(Poco::JSON::Array::Ptr json);
	std::string replaceNewLineWithBr(std::string& in);
};

#endif // __GRADIDO_LOGIN_SERVER_LIB_DATA_TYPE_CONVERTER_H
