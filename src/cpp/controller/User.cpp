#include "User.h"

#include "sodium.h"

#include "../SingletonManager/SessionManager.h"

namespace controller {
	User::User(model::table::User* dbModel)
	{
		mDBModel = dbModel;
	}

	User::~User()
	{
	}


	Poco::AutoPtr<User> User::create()
	{
		auto db = new model::table::User();
		auto user = new User(db);
		return Poco::AutoPtr<User>(user);
	}

	Poco::AutoPtr<User> User::create(const std::string& email, const std::string& first_name, const std::string& last_name, Poco::UInt64 passwordHashed/* = 0*/, std::string languageKey/* = "de"*/)
	{
		auto db = new model::table::User(email, first_name, last_name, passwordHashed, languageKey);
		auto user = new User(db);
		return Poco::AutoPtr<User>(user);
	}
	
	std::vector<User*> User::search(const std::string& searchString)
	{
		
		auto sm = SessionManager::getInstance();
		auto db = new model::table::User();
		
		std::string globalSearch = "%" + searchString + "%";

		std::vector<model::table::UserTuple> resultFromDB;
		// check if search string is email
		if (sm->isValid(searchString, VALIDATE_EMAIL)) {
			resultFromDB = db->loadFromDB <std::string, model::table::UserTuple>("email", globalSearch);
		}
		else {
			std::vector<std::string> fieldNames =  { "first_name", "last_name" };
			std::vector<std::string> fieldValues = { globalSearch, globalSearch };
			resultFromDB = db->loadFromDB<std::string, model::table::UserTuple>(fieldNames, fieldValues, model::table::MYSQL_CONDITION_OR);
		}

		db->release();
		db = nullptr;

		std::vector<User*> resultVector;
		resultVector.reserve(resultFromDB.size());
		for (auto it = resultFromDB.begin(); it != resultFromDB.end(); it++) {
			resultVector.push_back(new User(new model::table::User(*it)));
		}
		return resultVector;

	}

	int User::load(const unsigned char* pubkey_array)
	{
		Poco::Data::BLOB pubkey(pubkey_array, 32);
		return getModel()->loadFromDB("pubkey", pubkey);
	}

	const std::string& User::getPublicHex()
	{
		if (mPublicHex != "") {
			return mPublicHex;
		}

		auto mm = MemoryManager::getInstance();

		lock("User::getJson");
		Poco::JSON::Object userObj;

		auto pubkey = getModel()->getPublicKey();

		if (pubkey) {
			auto pubkeyHex = mm->getFreeMemory(65);
			memset(*pubkeyHex, 0, 65);
			sodium_bin2hex(*pubkeyHex, 65, pubkey, 32);
			mPublicHex = (char*)*pubkeyHex;
			mm->releaseMemory(pubkeyHex);
			unlock();
			return mPublicHex;
		}
		else {
			unlock();
			return "";
		}
		
		unlock();
		return "<error>";
		
	}

	Poco::JSON::Object User::getJson()
	{
		auto json = getModel()->getJson();
		auto pubkey = getPublicHex();
		if (pubkey != "") {
			json.set("public_hex", pubkey);
		}
		return json;
	}

}