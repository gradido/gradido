#include "UserBackups.h"

namespace controller {
	UserBackups::UserBackups(model::table::UserBackups* dbModel)
	{
		mDBModel = dbModel;
	}

	UserBackups::~UserBackups()
	{

	}

	

	//  ---------------   static members ----------------------------- 

	Poco::AutoPtr<UserBackups> UserBackups::create(int user_id, const std::string& passphrase)
	{
		
		auto db = new model::table::UserBackups(user_id, passphrase);
		return Poco::AutoPtr<UserBackups>(new UserBackups(db));
	}


	std::vector<Poco::AutoPtr<UserBackups>> UserBackups::load(int user_id)
	{
		auto db = new model::table::UserBackups();
		auto results = db->loadFromDB<int, model::table::UserBackupsTuple>("user_id", user_id, 1);

		std::vector<Poco::AutoPtr<UserBackups>> resultObjects;
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
			resultObjects.push_back(new UserBackups(new model::table::UserBackups(*it)));
		}

		return resultObjects;

	}

	Poco::SharedPtr<KeyPair> UserBackups::getKeyPair()
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

	std::string UserBackups::getPassphrase(ServerConfig::Mnemonic_Types type)
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

	std::string UserBackups::formatPassphrase(std::string passphrase, int targetLinesCount/* = 5*/) 
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