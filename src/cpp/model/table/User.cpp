#include "User.h"

#include "Poco/Data/Binding.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {

		User::User()
			: mPasswordHashed(0), mEmailChecked(false), mLanguageKey("de")
		{
		}

		User::User(const std::string& email, const std::string& first_name, const std::string& last_name, Poco::UInt64 passwordHashed/* = 0*/, std::string languageKey/* = "de"*/)
			: mEmail(email), mFirstName(first_name), mLastName(last_name), mPasswordHashed(passwordHashed), mEmailChecked(false), mLanguageKey(languageKey)
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
		
		Poco::Data::Statement User::_loadFromDB(Poco::Data::Session session, std::string& fieldName)
		{

			Poco::Data::Statement select(session);
			int email_checked = 0;
			select << "SELECT id, email, first_name, last_name, password, pubkey, privkey, email_checked, language from " << getTableName() << " where " << fieldName << " = ?",
				into(mID), into(mEmail), into(mFirstName), into(mLastName), into(mPasswordHashed), into(mPublicKey), into(mPrivateKey), into(email_checked), into(mLanguageKey);

			return select;
		}
	}
}