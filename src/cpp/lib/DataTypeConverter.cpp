#include "DataTypeConverter.h"

#include <stdexcept>
#include "sodium.h"

// needed for memset in linux
#include <string.h>

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

	MemoryBin* base64ToBin(const std::string& base64String)
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

		return bin;
	}


	std::string binToBase64(const MemoryBin* data)
	{
		auto mm = MemoryManager::getInstance();
		size_t binSize = data->size();
		size_t encodedSize = sodium_base64_encoded_len(binSize, sodium_base64_VARIANT_ORIGINAL);

		auto base64 = mm->getFreeMemory(encodedSize);
		memset(*base64, 0, encodedSize);

		size_t resultBinSize = 0;

		if (0 != sodium_bin2base64(*base64, encodedSize, *data, binSize, sodium_base64_VARIANT_ORIGINAL)) {
			mm->releaseMemory(base64);
			return "";
		}

		std::string base64String((const char*)*base64, encodedSize);
		mm->releaseMemory(base64);
		return base64String;
	}

	std::string binToHex(const MemoryBin* data)
	{
		auto mm = MemoryManager::getInstance();
		size_t hexSize = data->size() * 2 + 1;
		size_t binSize = data->size();
		MemoryBin* hex = mm->getFreeMemory(hexSize);
		memset(*hex, 0, hexSize);

		size_t resultBinSize = 0;

		sodium_bin2hex(*hex, hexSize, *data, binSize);

		std::string hexString((const char*)*hex, hexSize);
		mm->releaseMemory(hex);
		return hexString;
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
}