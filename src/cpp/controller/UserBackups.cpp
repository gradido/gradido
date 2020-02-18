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

}