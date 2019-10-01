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

#include "DRHashList.h"
#include <string>

#define PHRASE_WORD_COUNT 24


class Mnemonic 
{
public: 
	Mnemonic();
	~Mnemonic();

	int init(void(*fill_words_func)(unsigned char*), unsigned int original_size, unsigned int compressed_size);

	inline const char* getWord(unsigned int index) { if (index < 2048) return mWords[index]; return nullptr; }
	inline unsigned long getWordIndex(const char* word) { DHASH word_hash = DRMakeStringHash(word); return (long)mWordHashIndices.findByHash(word_hash); }
	inline bool isWordExist(const std::string& word) { DHASH word_hash = DRMakeStringHash(word.data());  return mWordHashIndices.itemExists(word_hash); }

protected:
	char* mWords[2048];
	DRHashList mWordHashIndices;
};

#endif //DR_MNEMONIC_H
