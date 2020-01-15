#include "User.h"

namespace controller {
	User::User(model::table::User* dbModel)
		: mUserRole(USER_ROLE_NOT_LOADED)
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

}