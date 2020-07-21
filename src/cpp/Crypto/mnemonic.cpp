

#include "mnemonic.h"
#include <memory>
#include <cstring>
#include <assert.h>
#include <mutex> 
#include "../dependencies/tinf/src/tinf.h"

#include "DRRandom.h"

#include "../SingletonManager/ErrorManager.h"
#include "../ServerConfig.h"

#include "Poco/RegularExpression.h"

static Poco::RegularExpression g_checkValidWord("^[a-zA-ZÄÖÜäöüß&;]*$");

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
	std::unique_lock<std::shared_mutex> _lock(mWorkingMutex);
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
		std::string uncompressed_file_name = "uncompressed_buffer";
		uncompressed_file_name += std::to_string(original_size);
		uncompressed_file_name += ".txt";
		FILE* f = fopen(uncompressed_file_name.data(), "w");
		fwrite(uncompressed_buffer, sizeof(char), original_size, f);
		fclose(f);

		unsigned short cursor = 0;
		u32 word_begin = 0, word_end = 0;

		for (unsigned int i = 0; i < original_size; i++) {
			if (cursor >= 2048) {
				return -3;
			}
			if (uncompressed_buffer[i] == ',' || i == original_size - 1) {
				word_end = i;

				u32 word_size = word_end - word_begin;
				if (word_size < 3) {
					printf("[%s] ERROR! word is smaller than 3, word size: %d, index: %d \n", 
						__FUNCTION__, word_size, cursor
					);
					char acBuffer[22]; memset(acBuffer, 0, 22);
					int _start = word_end - 10;
					if (_start < 0) {
						_start = 0;
					}
					memcpy(acBuffer, &uncompressed_buffer[_start], 20);
					printf("word_end: %d, word_begin: %d, part: %s\n", word_end, word_begin, acBuffer);
				}
				if (word_end < word_begin) {
					printf("%c %c %c\n", uncompressed_buffer[i - 1], uncompressed_buffer[i], uncompressed_buffer[i + 1]);
					printf("%s\n", uncompressed_buffer);
					continue;
				}
				if (uncompressed_buffer[i] != ',') {
					//printf("last char: %c\n", uncompressed_buffer[i]);
					word_size++;
				}
				// + 1 for null terminating
				mWords[cursor] = (char*)malloc(word_size + 1);

				// fill hash list for fast reverse lookup
				memset(mWords[cursor], 0, word_size + 1);
				if (word_begin + word_size > original_size) {
					printf("c[Mnemonic::%s] word goes out of array bounds\n", __FUNCTION__);
					free(uncompressed_buffer);
					return -4;
				}
				memcpy(mWords[cursor], &uncompressed_buffer[word_begin], word_size);
				//printf("%d: %s\n", cursor, mWords[cursor]);

				DHASH word_hash = DRMakeStringHash(mWords[cursor]);
				//mWordHashIndices.addByHash(word_hash, (void*)cursor);
				auto result = mWordHashIndices.insert(WordHashEntry(word_hash, cursor));
				if (!result.second) {
					// handle hash collision
					auto it_collide = mHashCollisionWords.find(word_hash);
					if (it_collide == mHashCollisionWords.end()) {
						std::map<std::string, unsigned short> collidedWordsMap;
						collidedWordsMap.insert(HashCollideWordEntry(mWords[result.first->second], result.first->second));
						auto result2 = mHashCollisionWords.insert(std::pair<DHASH, std::map<std::string, unsigned short>>(word_hash, collidedWordsMap));
						if (!result2.second) {
							free(uncompressed_buffer);
							printf("c[Mnemonc::%s] error inserting hash collided word map\n", __FUNCTION__);
							return -6;
						}
						it_collide = result2.first;
					}
					assert(it_collide != mHashCollisionWords.end());

					auto result3 = it_collide->second.insert(HashCollideWordEntry(mWords[cursor], cursor));
					if (!result3.second) {
						free(uncompressed_buffer);
						printf("c[Mnemonc::%s] error inserting hash collided word entry\n", __FUNCTION__);
						return -7;
					}

					//printf("c[Mnemonic::%s] error inserting word, hash collision?\n", __FUNCTION__);
					//printf("current word: %s\n", mWords[cursor]);
					//printf("existing word: %s\n", mWords[result.first->second]);
				}

				word_begin = i + 1;
				cursor++;
			}
		}
		//printf("c[Mnemonic::%s] before freeing uncompressed buffer \n", __FUNCTION__);
		free(uncompressed_buffer);

		// remove hash colliding entrys from regular map
		for (auto it_collide = mHashCollisionWords.begin(); it_collide != mHashCollisionWords.end(); it_collide++) {
			mWordHashIndices.erase(it_collide->first);
		}

		return 0;
	}
	//printf("c[Mnemonic::%s] before freeing buffer \n", __FUNCTION__);
	free(buffer);
	return -5;
}

short Mnemonic::getWordIndex(const char* word) const 
{ 
	std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);
	DHASH word_hash = DRMakeStringHash(word); 
	auto it = mWordHashIndices.find(word_hash);
	if (it != mWordHashIndices.end()) {
		return it->second;
	}
	auto it_collide = mHashCollisionWords.find(word_hash);
	if (it_collide != mHashCollisionWords.end()) {
		auto it_collided_word = it_collide->second.find(word);
		if (it_collided_word != it_collide->second.end()) {
			return it_collided_word->second;
		}
	}
	return -1;
}

/*
bool Mnemonic::isWordExist(const std::string& word) const 
{ 
	return getWordIndex(word.data()) != -1;
	//DHASH word_hash = DRMakeStringHash(word.data());  
	//return mWordHashIndices.find(word_hash) != mWordHashIndices.end(); 
}
*/

const char* Mnemonic::getWord(short index) const {
	//std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);
	
	if (index < 2048 && index >= 0) {
		std::string word;
		{
			std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);
			word = mWords[index];
		}

		if (!g_checkValidWord.match(word, 0, Poco::RegularExpression::RE_NOTEMPTY)) {
			auto em = ErrorManager::getInstance();
			const char* function_name = "Mnemonic::getWord";
			em->addError(new ParamError(function_name, "invalid word", word));
			em->addError(new Error(function_name, "try to reload mnemonic word list, but this error is maybe evidence for a serious memory problem!!!"));

			if (!ServerConfig::loadMnemonicWordLists()) {
				em->addError(new Error(function_name, "error reloading mnemonic word lists"));
				em->sendErrorsAsEmail();
				return nullptr;
			}

			{
				std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);
				word = mWords[index];
			}
			if (!g_checkValidWord.match(word, 0, Poco::RegularExpression::RE_NOTEMPTY)) {
				em->addError(new Error(function_name, "word invalid after reload mnemonic word lists"));
				em->sendErrorsAsEmail();
				return nullptr;
			}
			em->sendErrorsAsEmail();

		}

		{
			std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);
			return mWords[index];
		}
	}
	return nullptr;
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
	mHashCollisionWords.clear();
}

#include "Poco/RegularExpression.h"

std::string Mnemonic::getCompleteWordList()
{
	std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);
	std::string result("");
	//std::string toReplaced[] = { "auml", "ouml", "uuml", "Auml", "Ouml", "Uuml", "szlig" };
	Poco::RegularExpression toReplaced[] = { "&auml;", "&ouml;", "&uuml;", "&Auml;", "&Ouml;", "&Uuml;", "&szlig;" };
	std::string replaceStrings[] = { "ä", "ö", "ü", "Ä", "Ö", "Ü", "ß" };
	for (int i = 0; i < 2048; i++) {
		if (mWords[i]) {
			std::string word = mWords[i];
			for (int s = 0; s < 7; s++) {
				toReplaced[s].subst(word, replaceStrings[s], Poco::RegularExpression::RE_GLOBAL);
			}
		
			result += std::to_string(i) + ": " + word + "\n";
		}
		else {
			result += std::to_string(i) + ": <word empty>\n";
		}
	}
	return result;
}

// comparison, not case sensitive.
bool compare_nocase(const std::string& first, const std::string& second)
{
	unsigned int i = 0;
	while ((i < first.length()) && (i < second.length()))
	{
		if (tolower(first[i]) < tolower(second[i])) return true;
		else if (tolower(first[i]) > tolower(second[i])) return false;
		++i;
	}
	return (first.length() < second.length());
}

std::string Mnemonic::getCompleteWordListSorted()
{
	std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);
	std::string result("");
	
	std::list<std::string> words;
	for (int i = 0; i < 2048; i++) {
		if (mWords[i]) {
			words.push_back(mWords[i]);
		}
		else {
			printf("missing word on %d\n", i);
		}
	}
	words.sort(compare_nocase);

	//std::string toReplaced[] = { "auml", "ouml", "uuml", "Auml", "Ouml", "Uuml", "szlig" };
	Poco::RegularExpression toReplaced[] = { "&auml;", "&ouml;", "&uuml;", "&Auml;", "&Ouml;", "&Uuml;", "&szlig;" };
	std::string replaceStrings[] = { "ä", "ö", "ü", "Ä", "Ö", "Ü", "ß" };
	int i = 0;
	for(auto it = words.begin(); it != words.end(); it++) {
		std::string word = *it;
		for (int s = 0; s < 7; s++) {
			toReplaced[s].subst(word, replaceStrings[s], Poco::RegularExpression::RE_GLOBAL);
		}

		result += std::to_string(i) + ": " + word + "\n";
		i++;
	}
	return result;
}

void Mnemonic::printToFile(const char* filename)
{
	std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);
	FILE* f = fopen(filename, "wt");
	auto words = getCompleteWordListSorted();
	fwrite(words.data(), 1, words.size(), f);
	fclose(f);
}

Poco::JSON::Array Mnemonic::getSortedWordList()
{
	std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);
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