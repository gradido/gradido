

#include "mnemonic.h"
#include <memory>
#include <cstring>
#include "../dependencies/tinf/src/tinf.h"

#include "DRRandom.h"

Mnemonic::Mnemonic()
{
	memset(mWords, 0, 2048);
//	mWordHashIndices.resize(2048);
}

Mnemonic::~Mnemonic()
{
	clear();
}



int Mnemonic::init(void(*fill_words_func)(unsigned char*), unsigned int original_size, unsigned int compressed_size)
{
	Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	clear();

	unsigned char* buffer = (unsigned char*)malloc(compressed_size);
	unsigned char* uncompressed_buffer = (unsigned char*)malloc(original_size + 1);
	memset(uncompressed_buffer, 0, original_size + 1);
	fill_words_func(buffer);

	// uncompress
	unsigned int original_size_cpy = original_size;

	if (tinf_gzip_uncompress(uncompressed_buffer, &original_size_cpy, buffer, compressed_size) != TINF_OK) {
		free(buffer);
		free(uncompressed_buffer);
		return -1;
	}
	if (original_size_cpy != original_size) {
		free(buffer);
		free(uncompressed_buffer);
		return -2;
	}
	else {
		free(buffer);

		DRRandom::seed(compressed_size);


		//printf("c[Mnemonic::%s] uncompressing success\n", __FUNCTION__);
		// fill words in array and hashList
		unsigned short cursor = 0;
		u32 word_begin = 0, word_end = 0;

		for (unsigned int i = 0; i < original_size; i++) {
			if (cursor >= 2048) {
				return -3;
			}
			if (uncompressed_buffer[i] == ',') {
				word_end = i;

				u32 word_size = word_end - word_begin;
				if (word_end < word_begin) {
					//printf("%c %c %c\n", uncompressed_buffer[i - 1], uncompressed_buffer[i], uncompressed_buffer[i + 1]);
					//printf("%s\n", uncompressed_buffer);
					continue;
				}
				// + 1 for null terminating
				mWords[cursor] = (char*)malloc(word_size + 1);

				// fill hash list for fast reverse lookup
				memset(mWords[cursor], 0, word_size + 1);
				if (word_begin + word_size >= original_size) {
					printf("c[Mnemonic::%s] word goes out of array bounds\n", __FUNCTION__);
					free(uncompressed_buffer);
					return -4;
				}
				memcpy(mWords[cursor], &uncompressed_buffer[word_begin], word_size);

				//char bu[256]; memset(bu, 0, 256);
				//memcpy(bu, &uncompressed_buffer[word_begin - 1], 10);
				//printf("word (%d): %s\n", cursor, bu);

				DHASH word_hash = DRMakeStringHash(mWords[cursor]);
				//mWordHashIndices.addByHash(word_hash, (void*)cursor);
				mWordHashIndices.insert(WordHashEntry(word_hash, cursor));

				word_begin = i + 1;
				cursor++;
			}
		}
		//printf("c[Mnemonic::%s] before freeing uncompressed buffer \n", __FUNCTION__);
		free(uncompressed_buffer);
		return 0;
	}
	//printf("c[Mnemonic::%s] before freeing buffer \n", __FUNCTION__);
	free(buffer);
	return -5;
}


void Mnemonic::clear()
{
	//Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	for (int i = 0; i < 2048; i++) {
		if (mWords[i]) {
			free(mWords[i]);
		}
	}
	memset(mWords, 0, 2048);
	mWordHashIndices.clear();
}

std::string Mnemonic::getCompleteWordList()
{
	std::string result("");
	for (int i = 0; i < 2048; i++) {
		if (mWords[i]) {
			result += std::to_string(i) + ": " + mWords[i] + "\n";
		}
		else {
			result += std::to_string(i) + ": <word empty>\n";
		}
	}
	return result;
}

void Mnemonic::printToFile(const char* filename)
{
	FILE* f = fopen(filename, "wt");
	auto words = getCompleteWordList();
	fwrite(words.data(), 1, words.size(), f);
	fclose(f);
}

Poco::JSON::Array Mnemonic::getSortedWordList()
{
	std::list<std::string> words;
	for (auto it = mWordHashIndices.begin(); it != mWordHashIndices.end(); it++) {
		words.push_back(mWords[it->second]);
	}
	words.sort();
	Poco::JSON::Array json;
	for (auto it = words.begin(); it != words.end(); it++) {
		json.add(*it);
	}
//	json.stringify()
	return json;
}