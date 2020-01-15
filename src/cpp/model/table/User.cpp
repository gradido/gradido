#include "User.h"

#include "Poco/Data/Binding.h"

#include "sodium.h"

#include "../../SingletonManager/MemoryManager.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {

		User::User()
			: mPasswordHashed(0), mEmailChecked(false), mLanguageKey("de"), mRole(ROLE_NOT_LOADED)
		{
		}

		User::User(const std::string& email, const std::string& first_name, const std::string& last_name, Poco::UInt64 passwordHashed/* = 0*/, std::string languageKey/* = "de"*/)
			: mEmail(email), mFirstName(first_name), mLastName(last_name), mPasswordHashed(passwordHashed), mEmailChecked(false), mLanguageKey(languageKey), mRole(ROLE_NOT_LOADED)
		{

		}

		User::~User()
		{

		}

		void User::setPrivateKey(const MemoryBin* privateKey)
		{
			if (!privateKey) {
				mPrivateKey = Poco::Nullable<Poco::Data::BLOB>();
			}
			else {
				mPrivateKey = Poco::Nullable<Poco::Data::BLOB>(Poco::Data::BLOB(*privateKey, privateKey->size()));
			}
			
		}

		void User::setPublicKey(const unsigned char* publicKey)
		{
			if (!publicKey) {
				mPublicKey = Poco::Nullable<Poco::Data::BLOB>();
			}
			else {
				mPrivateKey = Poco::Nullable<Poco::Data::BLOB>(Poco::Data::BLOB(publicKey, 32));
			}
		}

		Poco::Data::Statement User::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);

		
			if (mPasswordHashed) {
				insert << "INSERT INTO users (email, first_name, last_name, password, language) VALUES(?,?,?,?,?);",
					use(mEmail), use(mFirstName), use(mLastName), bind(mPasswordHashed), use(mLanguageKey);
			}
			else {
				insert << "INSERT INTO users (email, first_name, last_name, language) VALUES(?,?,?,?);",
					use(mEmail), use(mFirstName), use(mLastName), use(mLanguageKey);
			}

			return insert;
		}
		
		Poco::Data::Statement User::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			std::string _fieldName = fieldName;
			if (_fieldName == "id") {
				_fieldName = getTableName() + std::string(".id");
			}
			Poco::Data::Statement select(session);
			select << "SELECT " << getTableName() << ".id, email, first_name, last_name, password, pubkey, privkey, email_checked, language, user_roles.role_id " 
				   << " FROM " << getTableName() 
				   << " LEFT JOIN user_roles ON " << getTableName() << ".id = user_roles.user_id "
				   << " WHERE " << _fieldName << " = ?"
				,into(mID), into(mEmail), into(mFirstName), into(mLastName), into(mPasswordHashed), into(mPublicKey), into(mPrivateKey), into(mEmailChecked), into(mLanguageKey), into(mRole);


			return select;
		}

		Poco::Data::Statement User::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id FROM " << getTableName()
				<< " where email = ?"
				, into(mID), use(mEmail);

			return select;
		}

		/*
		std::string mEmail;
		std::string mFirstName;
		std::string mLastName;

		Poco::UInt64 mPasswordHashed;

		Poco::Nullable<Poco::Data::BLOB> mPublicKey;
		Poco::Nullable<Poco::Data::BLOB> mPrivateKey;
		// created: Mysql DateTime

		bool mEmailChecked;
		std::string mLanguageKey;

		char *sodium_bin2hex(char * const hex, const size_t hex_maxlen,
		const unsigned char * const bin, const size_t bin_len);
		*/
		std::string User::toString()
		{
			auto mm = MemoryManager::getInstance();
			auto pubkeyHex = mm->getFreeMemory(65);
			auto privkeyHex = mm->getFreeMemory(161);
			//char pubkeyHex[65], privkeyHex[161];
			
			//memset(pubkeyHex, 0, 65);
			//memset(privkeyHex, 0, 161);
			memset(*pubkeyHex, 0, 65);
			memset(*privkeyHex, 0, 161);

			std::stringstream ss;

			if (!mPublicKey.isNull()) {
				sodium_bin2hex(*pubkeyHex, 65, mPublicKey.value().content().data(), mPublicKey.value().content().size());
			}
			if (!mPrivateKey.isNull()) {
				sodium_bin2hex(*privkeyHex, 161, mPrivateKey.value().content().data(), mPrivateKey.value().content().size());
			}
			
			ss << mFirstName << " " << mLastName << " <" << mEmail << ">" << std::endl;
			ss << "password hash: " << mPasswordHashed << std::endl;
			ss << "public key: " << (char*)*pubkeyHex << std::endl;
			ss << "private key: " << (char*)*privkeyHex << std::endl;
			ss << "email checked: " << mEmailChecked << std::endl;
			ss << "language key: " << mLanguageKey << std::endl;

			mm->releaseMemory(pubkeyHex);
			mm->releaseMemory(privkeyHex);

			return ss.str();
		}


		Poco::JSON::Object User::getJson()
		{

			lock("User::getJson");
			Poco::JSON::Object userObj;

			userObj.set("first_name", mFirstName);
			userObj.set("last_name", mLastName);
			userObj.set("email", mEmail);

			//userObj.set("state", userStateToString(mState));
			userObj.set("email_checked", mEmailChecked);
			userObj.set("ident_hash", DRMakeStringHash(mEmail.data(), mEmail.size()));
			try {
				userObj.set("role", UserRoles::typeToString(getRole()));
			}
			catch (Poco::Exception ex) {
				addError(new ParamError("User::getJson", "exception by getting role", ex.displayText().data()));
				sendErrorsAsEmail();
			}
			unlock();

			return userObj;
		}
	}
}