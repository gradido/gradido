#ifndef DR_MNEMONIC_H
#define DR_MNEMONIC_H

/*!
 * 
 * @author: einhornimmond
 * 
 * @date: 16.06.19
 * 
 * @desc: Class for handling mnemonic word list, unpacking, reverse lookup
 * 
 */

#include "../lib/DRHashList.h"
#include "Poco/Mutex.h"
#include <string>
#include <map>
#include <list>

#include "Poco/JSON/Array.h"

#define PHRASE_WORD_COUNT 24


class Mnemonic 
{
public: 
	Mnemonic();
	~Mnemonic();

	int init(void(*fill_words_func)(unsigned char*), unsigned int original_size, unsigned int compressed_size);

	inline const char* getWord(short index) const {  if (index < 2048 && index >= 0) return mWords[index]; return nullptr; }
	short getWordIndex(const char* word) const;
	inline bool isWordExist(const std::string& word) const { return getWordIndex(word.data()) != -1; }
	// using only for debugging
	std::string getCompleteWordList();

	Poco::JSON::Array getSortedWordList();

	void printToFile(const char* filename);

protected:

	void clear();

	struct HashCollisionWords {
		DHASH hash;
		std::vector<std::string> words;
	};

	char* mWords[2048];
	//DRHashList mWordHashIndices;
	typedef std::pair<DHASH, unsigned short> WordHashEntry;
	typedef std::pair<std::string, unsigned short> HashCollideWordEntry;
	std::map<DHASH, unsigned short> mWordHashIndices;
	std::map<DHASH, std::map<std::string, unsigned short>> mHashCollisionWords;
	Poco::Mutex mWorkingMutex;

};

#endif //DR_MNEMONIC_H
