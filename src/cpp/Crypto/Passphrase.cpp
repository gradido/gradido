#include "Passphrase.h"

#include "Poco/Types.h"
#include "Poco/Tuple.h"


#include "../SingletonManager/ErrorManager.h"

#include "KeyPairEd25519.h"

#include "../ServerConfig.h"

#define STR_BUFFER_SIZE 25

static std::vector<Poco::Tuple<int, std::string>> g_specialChars = {
	{ 0xa4, "auml" },{ 0x84, "Auml" },
	{ 0xbc, "uuml" },{ 0x9c, "Uuml" },
	{ 0xb6, "ouml" },{ 0x96, "Ouml" },
	{ 0x9f, "szlig" }
};

Passphrase::Passphrase(const std::string& passphrase, const Mnemonic* wordSource)
	: mPassphraseString(filter(passphrase)), mWordSource(wordSource)
{
	memset(mWordIndices, 0, PHRASE_WORD_COUNT * sizeof(Poco::UInt16));
}


std::string Passphrase::filter(const std::string& passphrase)
{
	std::string filteredPassphrase;
	auto passphrase_size = passphrase.size();

	for (int i = 0; i < passphrase_size; i++) {
		unsigned char c = passphrase.data()[i];
		// asci 128 even by utf8 (hex)
		// 0000 0000 ñ 0000 007F
		// utf8
		if (c > 0x0000007F) {
			int additionalUtfByteCount = 0;
			//filteredPassphrase += c;
			if ((c & 0x00000080) == 0x00000080) {
				// c3 a4 => ‰
				// c3 bc => ¸
				// c3 b6 => ˆ
				// c3 84 => ƒ
				// c3 96 => ÷
				// c3 9c => ‹
				// c3 9f => ﬂ



				unsigned char c2 = passphrase.data()[i + 1];
				bool insertedHtmlEntitie = false;
				for (auto it = g_specialChars.begin(); it != g_specialChars.end(); it++) {
					if (c2 == it->get<0>()) {
						auto htmlEntitie = it->get<1>();
						filteredPassphrase += "&";
						filteredPassphrase += htmlEntitie;
						filteredPassphrase += ";";
						i++;
						insertedHtmlEntitie = true;
						break;
					}
				}
				if (insertedHtmlEntitie) continue;
				additionalUtfByteCount = 1;
			}
			else if ((c & 0x00000800) == 0x00000800) {
				additionalUtfByteCount = 2;
			}
			else if ((c & 0x00010000) == 0x00010000) {
				additionalUtfByteCount = 3;
			}
			for (int j = 0; j <= additionalUtfByteCount; j++) {
				filteredPassphrase += passphrase.data()[i + j];
				i++;
			}
		}
		else {
			// 32 = Space
			// 65 = A
			// 90 = Z
			// 97 = a
			// 122 = z
			// 59 = ;
			// 38 = &
			if (c == 32 || c == 59 || c == 38 ||
				(c >= 65 && c <= 90) ||
				(c >= 97 && c <= 122)) {
				filteredPassphrase += c;
			}
			else if (c == '\n' || c == '\r') {
				filteredPassphrase += ' ';
			}
		}

	}
	return filteredPassphrase;
}

Poco::AutoPtr<Passphrase> Passphrase::transform(const Mnemonic* targetWordSource)
{

	/*
	if (!currentWordSource || !targetWordSource) {
		return "";
	}
	if (targetWordSource == currentWordSource) {
		return passphrase;
	}
	auto word_indices = createWordIndices(passphrase, currentWordSource);
	if (!word_indices) {
		return "";
	}

	return createClearPassphraseFromWordIndices(word_indices, targetWordSource);*/
//	Poco::SharedPtr<Passphrase> transformedPassphrase = new Passphrase()

	if (!targetWordSource || !mWordSource) {
		return nullptr;
	}
	if (targetWordSource == mWordSource) {
		duplicate();
		return this;
	}
	if (createWordIndices()) {
		return create(mWordIndices, targetWordSource);
	}
	return nullptr;
}

Poco::AutoPtr<Passphrase> Passphrase::create(const MemoryBin* wordIndices, const Mnemonic* wordSource)
{
	if (PHRASE_WORD_COUNT * sizeof(Poco::UInt16) >= wordIndices->size()) {
		return nullptr;
	}

	const Poco::UInt16* word_indices_p = (const Poco::UInt16*)wordIndices->data();
	return create(word_indices_p, wordSource);
}

std::string Passphrase::createClearPassphrase() const
{
	auto word_indices = getWordIndices();
	std::string clear_passphrase;
	auto word_source = &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER];
	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		auto word = word_source->getWord(word_indices[i]);
		if (word) {
			clear_passphrase += word;
			clear_passphrase += " ";
		}
	}
	return clear_passphrase;
}

Poco::AutoPtr<Passphrase> Passphrase::create(const Poco::UInt16 wordIndices[PHRASE_WORD_COUNT], const Mnemonic* wordSource)
{
	std::string clearPassphrase;
	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		auto word = wordSource->getWord(wordIndices[i]);
		if (word) {
			clearPassphrase += word;
			clearPassphrase += " ";
		}
		else {
			return nullptr;
		}
	}
	return new Passphrase(clearPassphrase, wordSource);
}

Poco::AutoPtr<Passphrase> Passphrase::generate(const Mnemonic* wordSource) 
{	
	auto em = ErrorManager::getInstance();
	auto mm = MemoryManager::getInstance();
	auto word_indices = mm->getFreeMemory(PHRASE_WORD_COUNT * sizeof(Poco::UInt16));
	Poco::UInt16* word_indices_p = (Poco::UInt16*)word_indices->data();

	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		word_indices_p[i] = randombytes_random() % 2048;
	}
	auto result_passphrase = create(word_indices_p, wordSource);
	mm->releaseMemory(word_indices);

	return result_passphrase;
	/*

	unsigned int random_indices[PHRASE_WORD_COUNT];

	unsigned int str_sizes[PHRASE_WORD_COUNT];
	unsigned int phrase_buffer_size = 0;
	static const char* function_name = "Passphrase::generate";
	bool error_reloading_mnemonic_word_list = false;
	int loop_trys = 0;
	Poco::RegularExpression check_valid_word("^[a-zA-Zƒ÷‹‰ˆ¸ﬂ&;]*$");

	// TODO: make sure words didn't double
	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		random_indices[i] = randombytes_random() % 2048;
		auto word = wordSource->getWord(random_indices[i]);
		if (loop_trys > 10 || error_reloading_mnemonic_word_list) {
			return nullptr;
		}
		if (!word) {
			em->addError(new ParamError(function_name, "empty word get for index", random_indices[i]));
			em->sendErrorsAsEmail();

			random_indices[i] = randombytes_random() % 2048;
			word = wordSource->getWord(random_indices[i]);
			if (!word) return nullptr;

		}
		else {
			if (!check_valid_word.match(word, 0, Poco::RegularExpression::RE_NOTEMPTY)) {
				em->addError(new ParamError(function_name, "invalid word", word));
				em->addError(new Error(function_name, "try to reload mnemonic word list, but this error is maybe evidence for a serious memory problem!!!"));
				if (!ServerConfig::loadMnemonicWordLists()) {
					em->addError(new Error(function_name, "error reloading mnemonic word lists"));
					error_reloading_mnemonic_word_list = true;
				}
				else {
					i = 0;
					loop_trys++;
				}
				em->sendErrorsAsEmail();
			}
		}
		str_sizes[i] = strlen(word);
		phrase_buffer_size += str_sizes[i];
	}
	phrase_buffer_size += PHRASE_WORD_COUNT + 1;

	std::string phrase_buffer(phrase_buffer_size, '\0');
	int phrase_buffer_cursor = 0;

	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		memcpy(&phrase_buffer[phrase_buffer_cursor], wordSource->getWord(random_indices[i]), str_sizes[i]);

		phrase_buffer_cursor += str_sizes[i];
		phrase_buffer[phrase_buffer_cursor++] = ' ';
	}


	return create(;
	*/
}

bool Passphrase::createWordIndices()
{
	auto er = ErrorManager::getInstance();
	auto mm = MemoryManager::getInstance();
	const char* functionName = "Passphrase::createWordIndices";

	if (!mWordSource) {
		er->addError(new Error(functionName, "word source is empty"));
		return false;
	}

	
	//DHASH key = DRMakeStringHash(passphrase);
	size_t pass_phrase_size = mPassphraseString.size();

	char acBuffer[STR_BUFFER_SIZE]; memset(acBuffer, 0, STR_BUFFER_SIZE);
	size_t buffer_cursor = 0;

	// get word indices for hmac key
	unsigned char word_cursor = 0;
	for (auto it = mPassphraseString.begin(); it != mPassphraseString.end(); it++)
	{
		if (*it == ' ') {
			if (buffer_cursor < 3) {
				continue;
			}
			if (PHRASE_WORD_COUNT > word_cursor && mWordSource->isWordExist(acBuffer)) {
				mWordIndices[word_cursor] = mWordSource->getWordIndex(acBuffer);
				//word_indices_old[word_cursor] = word_source->getWordIndex(acBuffer);
			}
			else {
				er->addError(new ParamError(functionName, "word didn't exist", acBuffer));
				er->sendErrorsAsEmail();
				return false;
			}
			word_cursor++;
			memset(acBuffer, 0, STR_BUFFER_SIZE);
			buffer_cursor = 0;

		}
		else {
			acBuffer[buffer_cursor++] = *it;
		}
	}
	if (PHRASE_WORD_COUNT > word_cursor && mWordSource->isWordExist(acBuffer)) {
		mWordIndices[word_cursor] = mWordSource->getWordIndex(acBuffer);
		//word_indices_old[word_cursor] = word_source->getWordIndex(acBuffer);
		word_cursor++;
	}
	//printf("word cursor: %d\n", word_cursor);
	/*if (memcmp(word_indices_p, word_indices_old, word_indices->size()) != 0) {

	printf("not identical\n");
	memcpy(word_indices_p, word_indices_old, word_indices->size());
	}*/
	return true;
}

const Poco::UInt16* Passphrase::getWordIndices()
{
	if (!(mWordIndices[0] | mWordIndices[1] | mWordIndices[2] | mWordIndices[3])) {
		if (createWordIndices()) return mWordIndices;
	}
	return mWordIndices;
}

const Poco::UInt16* Passphrase::getWordIndices() const
{
	return mWordIndices;
}

bool Passphrase::checkIfValid()
{
	std::istringstream iss(mPassphraseString);
	std::vector<std::string> results(std::istream_iterator<std::string>{iss},
	std::istream_iterator<std::string>());

	bool existAll = true;
	for (auto it = results.begin(); it != results.end(); it++) {
		if (*it == "\0" || *it == "" || it->size() < 3) continue;
		if (!mWordSource->isWordExist(*it)) {
			return false;
		}
	}
	return true;
}
const Mnemonic* Passphrase::detectMnemonic(const std::string& passphrase, const KeyPairEd25519* keyPair /* = nullptr*/)
{
	std::istringstream iss(passphrase);
	std::vector<std::string> results(std::istream_iterator<std::string>{iss},
		std::istream_iterator<std::string>());

	for (int i = 0; i < ServerConfig::Mnemonic_Types::MNEMONIC_MAX; i++) {
		Mnemonic& m = ServerConfig::g_Mnemonic_WordLists[i];
		bool existAll = true;
		for (auto it = results.begin(); it != results.end(); it++) {
			if (*it == "\0" || *it == "" || it->size() < 3) continue;
			if (!m.isWordExist(*it)) {
				existAll = false;
				// leave inner for-loop
				break;
			}
		}
		if (existAll) {
			if (keyPair) {
				Poco::AutoPtr<Passphrase> test_passphrase = new Passphrase(passphrase, &m);
				test_passphrase->createWordIndices();
				auto key_pair = KeyPairEd25519::create(test_passphrase);
				if (key_pair) {
					if (*key_pair != *keyPair) {
						delete key_pair;
						continue;
					}
					else {
						delete key_pair;
					}
				}
			}
			return &ServerConfig::g_Mnemonic_WordLists[i];
		}
	}
	return nullptr;
}