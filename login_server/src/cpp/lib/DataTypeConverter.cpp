#include "DataTypeConverter.h"

#include "Poco/RegularExpression.h"

#include <stdexcept>
#include "sodium.h"
#include <assert.h>

// needed for memset in linux
#include <string.h>

namespace DataTypeConverter
{
	Poco::RegularExpression g_rexExpBase64("^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$");

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
#ifdef __linux__
	NumberParseState strToInt(const std::string& input, unsigned long long& result)
	{
		try {
			result = stoull(input);
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
#endif
	NumberParseState strToInt(const std::string& input, Poco::UInt64& result)
	{
		try {
			result = stoull(input);
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

	NumberParseState strToDouble(const std::string& input, double& result)
	{
		auto comma_position = input.find(',');
		std::string input_filtered = input;
		if (comma_position > 0 && comma_position != input.npos) {
			input_filtered = input_filtered.replace(comma_position, 0, 1, '.');
		}
		try {
			result = stod(input_filtered);
			return NUMBER_PARSE_OKAY;
		}
		catch (const std::invalid_argument& ia)
		{
			printf("[strToDouble] exception: invalid argument: %s\n", ia.what());
			return NUMBER_PARSE_INVALID_ARGUMENT;
		}
		catch (const std::out_of_range& oor)
		{
			printf("[strToDouble] exception: out or range: %s\n", oor.what());
			return NUMBER_PARSE_OUT_OF_RANGE;
		}
		catch (const std::logic_error & ler)
		{
			printf("[strToDouble] exception: logical error: %s\n", ler.what());
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

	MemoryBin* hexToBin(const std::string& hexString)
	{
		/*
		int sodium_hex2bin(unsigned char * const bin, const size_t bin_maxlen,
		const char * const hex, const size_t hex_len,
		const char * const ignore, size_t * const bin_len,
		const char ** const hex_end);

		The sodium_hex2bin() function parses a hexadecimal string hex and converts it to a byte sequence.

		hex does not have to be nul terminated, as the number of characters to parse is supplied via the hex_len parameter.

		ignore is a string of characters to skip. For example, the string ": " allows columns and spaces to be present at any locations in the hexadecimal string. These characters will just be ignored. As a result, "69:FC", "69 FC", "69 : FC" and "69FC" will be valid inputs, and will produce the same output.

		ignore can be set to NULL in order to disallow any non-hexadecimal character.

		bin_maxlen is the maximum number of bytes to put into bin.

		The parser stops when a non-hexadecimal, non-ignored character is found or when bin_maxlen bytes have been written.

		If hex_end is not NULL, it will be set to the address of the first byte after the last valid parsed character.

		The function returns 0 on success.

		It returns -1 if more than bin_maxlen bytes would be required to store the parsed string, or if the string couldn't be fully parsed, but a valid pointer for hex_end was not provided.

		It evaluates in constant time for a given length and format.
		*/

		auto mm = MemoryManager::getInstance();
		size_t hexSize = hexString.size();
		size_t binSize = (hexSize) / 2;
		MemoryBin* bin = mm->getFreeMemory(binSize);
		memset(*bin, 0, binSize);

		size_t resultBinSize = 0;

		if (0 != sodium_hex2bin(*bin, binSize, hexString.data(), hexSize, nullptr, &resultBinSize, nullptr)) {
			mm->releaseMemory(bin);
			return nullptr;
		}
		return bin;

	}

	MemoryBin* base64ToBin(const std::string& base64String, int variant /*= sodium_base64_VARIANT_ORIGINAL*/)
	{
		/*
		int sodium_base642bin(unsigned char * const bin, const size_t bin_maxlen,
		const char * const b64, const size_t b64_len,
		const char * const ignore, size_t * const bin_len,
		const char ** const b64_end, const int variant);

		sodium_base64_VARIANT_ORIGINAL
		*/
		auto mm = MemoryManager::getInstance();
		size_t encodedSize = base64String.size();
		size_t binSize = (encodedSize / 4) * 3;
		auto bin = mm->getFreeMemory(binSize);
		memset(*bin, 0, binSize);

		size_t resultBinSize = 0;

		if (0 != sodium_base642bin(*bin, binSize, base64String.data(), encodedSize, nullptr, &resultBinSize, nullptr, sodium_base64_VARIANT_ORIGINAL)) {
			mm->releaseMemory(bin);
			return nullptr;
		}
		if (resultBinSize < binSize) {
			auto bin_real = mm->getFreeMemory(resultBinSize);
			memcpy(*bin_real, *bin, resultBinSize);
			mm->releaseMemory(bin);
			return bin_real;
		}

		return bin;
	}

	


	std::string binToBase64(const unsigned char* data, size_t size, int variant /*= sodium_base64_VARIANT_ORIGINAL*/)
	{
		auto mm = MemoryManager::getInstance();
		
		size_t encodedSize = sodium_base64_encoded_len(size, variant);
		auto base64 = mm->getFreeMemory(encodedSize);
		memset(*base64, 0, encodedSize);

		if (nullptr == sodium_bin2base64(*base64, encodedSize, data, size, variant)) {
			mm->releaseMemory(base64);
			return "";
		}

		std::string base64String((const char*)*base64);
		mm->releaseMemory(base64);
		return base64String;
	}

	std::string binToHex(const unsigned char* data, size_t size)
	{
		auto mm = MemoryManager::getInstance();
		size_t hexSize = size * 2 + 1;
		size_t binSize = size;
		MemoryBin* hex = mm->getFreeMemory(hexSize);
		memset(*hex, 0, hexSize);

		size_t resultBinSize = 0;

		sodium_bin2hex(*hex, hexSize, data, binSize);

		std::string hexString((const char*)*hex, hexSize);
		mm->releaseMemory(hex);
		return hexString;
	}

	std::string binToHex(const Poco::Nullable<Poco::Data::BLOB>& nullableBin)
	{
		if (nullableBin.isNull()) {
			return "0x0";
		}
		else {
			return binToHex(nullableBin.value().content().data(), nullableBin.value().content().size());
		}
	}

	std::string pubkeyToHex(const unsigned char* pubkey)
	{
		auto mm = MemoryManager::getInstance();
		size_t hexSize = crypto_sign_PUBLICKEYBYTES * 2 + 1;
		size_t binSize = crypto_sign_PUBLICKEYBYTES;

		MemoryBin* hex = mm->getFreeMemory(hexSize);
		memset(*hex, 0, hexSize);

		size_t resultBinSize = 0;

		sodium_bin2hex(*hex, hexSize, pubkey, binSize);

		std::string hexString((const char*)*hex, hexSize-1);
		mm->releaseMemory(hex);
		return hexString;
	}

	std::string convertTimespanToLocalizedString(Poco::Timespan duration, LanguageCatalog* lang)
	{
		assert(lang);
		int value = 0;
		std::string result;
		std::string unit_name;
		if (duration.days() > 0) {
			value = duration.days();
			unit_name = "Day";
		}
		else if (duration.hours() > 0) {
			value = duration.hours();
			unit_name = "Hour";
		}
		else if (duration.minutes() > 0) {
			value = duration.minutes();
			unit_name = "Minute";
		}
		else {
			value = duration.seconds();
			unit_name = "Second";
		}
		result = std::to_string(value);
		result += " ";
		std::string unit_plural = unit_name;
		unit_plural += "s";
		result += lang->ngettext(unit_name.data(), unit_plural.data(), value);

		return result;
	}

	Poco::Timestamp convertFromProtoTimestamp(const proto::Timestamp& timestamp)
	{
		// microseconds
		google::protobuf::int64 microseconds = timestamp.seconds() * (google::protobuf::int64)10e5 + (google::protobuf::int64)(timestamp.nanos()) / (google::protobuf::int64)10e2;
		return microseconds;
	}

	Poco::Timestamp convertFromProtoTimestamp(const proto::gradido::Timestamp& timestamp)
	{
		// microseconds
		google::protobuf::int64 microseconds = timestamp.seconds() * (google::protobuf::int64)10e5 + (google::protobuf::int64)(timestamp.nanos()) / (google::protobuf::int64)10e2;
		return microseconds;
	}

	void convertToProtoTimestamp(const Poco::Timestamp pocoTimestamp, proto::Timestamp* protoTimestamp)
	{
		auto microsecondsTotal = pocoTimestamp.epochMicroseconds();
		auto secondsTotal = pocoTimestamp.epochTime();
		protoTimestamp->set_seconds(secondsTotal);
		protoTimestamp->set_nanos((microsecondsTotal - secondsTotal * pocoTimestamp.resolution()) * 1000);
	}

	void convertToProtoTimestamp(const Poco::Timestamp pocoTimestamp, proto::gradido::Timestamp* protoTimestamp)
	{
		auto microsecondsTotal = pocoTimestamp.epochMicroseconds();
		auto secondsTotal = pocoTimestamp.epochTime();
		protoTimestamp->set_seconds(secondsTotal);
		protoTimestamp->set_nanos((microsecondsTotal - secondsTotal * pocoTimestamp.resolution()) * 1000);
	}

	Poco::Timestamp convertFromProtoTimestampSeconds(const proto::gradido::TimestampSeconds& timestampSeconds)
	{
		google::protobuf::int64 microseconds = timestampSeconds.seconds() * (google::protobuf::int64)10e5;

		return microseconds;
	}


	Poco::Timespan convertFromProtoDuration(const proto::Duration& duration)
	{
		return Poco::Timespan(duration.seconds(), 0);
	}

	int replaceBase64WithHex(Poco::JSON::Object::Ptr json)
	{
		//g_rexExpBase64
		auto mm = MemoryManager::getInstance();
		int count_replacements = 0;

		for (Poco::JSON::Object::ConstIterator it = json->begin(); it != json->end(); it++)
		{
			if (json->isObject(it)) {
				auto local_json = it->second.extract<Poco::JSON::Object::Ptr>();
				count_replacements += replaceBase64WithHex(local_json);
				json->set(it->first, local_json);
			}
			else if (json->isArray(it)) {
				auto local_json = it->second.extract<Poco::JSON::Array::Ptr>();
				count_replacements += replaceBase64WithHex(local_json);
				json->set(it->first, local_json);
			}
			else if (it->second.isString()) 
			{
				if (it->first == "amount") continue;
				auto field_value = it->second.extract<std::string>();
				if(!g_rexExpBase64.match(field_value)) continue;

				auto bin = base64ToBin(field_value);
				if(!bin) continue;

				auto hex = binToHex(bin);
				mm->releaseMemory(bin);
				json->set(it->first, hex.substr(0, hex.size()-1));
				count_replacements++;
			}
		}

		return count_replacements;
	}

	int replaceBase64WithHex(Poco::JSON::Array::Ptr json)
	{
		auto mm = MemoryManager::getInstance();
		int count_replacements = 0;
		int count = 0;
		for (Poco::JSON::Array::ValueVec::const_iterator it = json->begin(); it != json->end(); it++)
		{
			if (json->isObject(it)) {
				
				auto local_json = it->extract<Poco::JSON::Object::Ptr>();
				count_replacements += replaceBase64WithHex(local_json);
				json->set(count, local_json);
			}
			else if (json->isArray(it)) {
				auto local_json = it->extract<Poco::JSON::Array::Ptr>();
				count_replacements += replaceBase64WithHex(local_json);
				json->set(count, local_json);
			}
			else if (it->isString())
			{
				auto field_value = it->extract<std::string>();
				if (!g_rexExpBase64.match(field_value)) continue;

				auto bin = base64ToBin(field_value);
				if (!bin) continue;

				auto hex = binToHex(bin);
				mm->releaseMemory(bin);
				json->set(count, hex.substr(0, hex.size()-1));
				count_replacements++;
			}
			count++;
		}

		return count_replacements;
	}

	std::string replaceNewLineWithBr(std::string& in)
	{
		
		std::string::size_type pos = 0; // Must initialize
		while ((pos = in.find("\r\n", pos)) != std::string::npos) {
			in.replace(pos, 2, "<br>");
		}
		pos = 0;
		while ((pos = in.find("\n", pos)) != std::string::npos) {
			in.replace(pos, 1, "<br>"); 
		}
		pos = 0;
		while ((pos = in.find(" ", pos)) != std::string::npos) {
			in.replace(pos, 1, "&nbsp;");
		}
		return in;
	}
}