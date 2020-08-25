#include "UserBackup.h"

#include "../Crypto/Passphrase.h"

namespace controller {
	UserBackup::UserBackup(model::table::UserBackup* dbModel)
	{
		mDBModel = dbModel;
	}

	UserBackup::~UserBackup()
	{

	}

	

	//  ---------------   static members ----------------------------- 

	Poco::AutoPtr<UserBackup> UserBackup::create(int user_id, const std::string& passphrase, ServerConfig::Mnemonic_Types type)
	{
		
		auto db = new model::table::UserBackup(user_id, passphrase, type);
		return Poco::AutoPtr<UserBackup>(new UserBackup(db));
	}


	std::vector<Poco::AutoPtr<UserBackup>> UserBackup::load(int user_id)
	{
		auto db = new model::table::UserBackup();
		auto results = db->loadFromDB<int, model::table::UserBackupsTuple>("user_id", user_id, 1);

		std::vector<Poco::AutoPtr<UserBackup>> resultObjects;
		if (db->errorCount()) {
			db->sendErrorsAsEmail();
			db->release();
			return resultObjects;
		}
		db->release();
		if (results.size() == 0) {
			return resultObjects;
		}
		for (auto it = results.begin(); it != results.end(); it++) {
			resultObjects.push_back(new UserBackup(new model::table::UserBackup(*it)));
		}

		return resultObjects;

	}

	Poco::SharedPtr<KeyPair> UserBackup::getKeyPair()
	{
		if (!mKeyPair.isNull()) {
			return mKeyPair;
		}
		mKeyPair = new KeyPair;
		auto model = getModel();
		auto passphrase = model->getPassphrase();
		
		mKeyPair->generateFromPassphrase(passphrase);
		return mKeyPair;
	}

	KeyPairEd25519* UserBackup::createGradidoKeyPair()
	{
		auto model = getModel();
		auto mnemonicType = model->getMnemonicType();
		assert(mnemonicType >= 0 && mnemonicType < ServerConfig::MNEMONIC_MAX);
		auto wordSource = &ServerConfig::g_Mnemonic_WordLists[mnemonicType];
		Poco::AutoPtr<Passphrase> passphrase = new Passphrase(model->getPassphrase(), wordSource);
		return KeyPairEd25519::create(passphrase);
	}

	std::string UserBackup::getPassphrase(ServerConfig::Mnemonic_Types type)
	{
		if ((int)type < 0 || (int)type >= ServerConfig::Mnemonic_Types::MNEMONIC_MAX) {
			return "<invalid type>";
		}
		auto passphrase = getModel()->getPassphrase();
		Mnemonic* wordSource = nullptr;
		if (KeyPair::validatePassphrase(passphrase, &wordSource)) {
			for (int i = 0; i < ServerConfig::Mnemonic_Types::MNEMONIC_MAX; i++) {
				Mnemonic* m = &ServerConfig::g_Mnemonic_WordLists[i];
				if (m == wordSource) {
					if (type == i) {
						return passphrase;
					}
					else {
						return KeyPair::passphraseTransform(passphrase, m, &ServerConfig::g_Mnemonic_WordLists[type]);
					}
				}
			}
		}
		
		return "<invalid passphrase>";
		
	}

	std::string UserBackup::formatPassphrase(std::string passphrase, int targetLinesCount/* = 5*/) 
	{
		int count = passphrase.size();
		int charPerLine = count / (targetLinesCount);
		int cursor = 0;
		for (int i = 1; i < targetLinesCount; i++) {
			cursor = charPerLine * i;
			while (cursor < count && passphrase.at(cursor) != ' ') {
				cursor++;
			}
			if (cursor >= (count-2)) break;
			passphrase.replace(cursor, 1, 1, '\n');
		}
		return passphrase;
	}

}