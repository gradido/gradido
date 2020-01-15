#include "User.h"

#include "sodium.h"

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
		auto pubkeyHex = mm->getFreeMemory(65);
		memset(*pubkeyHex, 0, 65);

		lock("User::getJson");
		Poco::JSON::Object userObj;

		auto pubkey = getModel()->getPublicKey();

		if (pubkey) {
			sodium_bin2hex(*pubkeyHex, 65, pubkey, 32);
		}
		mPublicHex = (char*)*pubkeyHex;

		unlock();

		mm->releaseMemory(pubkeyHex);

		return mPublicHex;
	}

	Poco::JSON::Object User::getJson()
	{
		auto json = getModel()->getJson();
		json.set("public_hex", getPublicHex());
		return json;
	}

}