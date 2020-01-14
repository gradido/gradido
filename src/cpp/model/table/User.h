#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_INCLUDE

#include "ModelBase.h"
#include "../../SingletonManager/MemoryManager.h"

//#include "Poco/Nullable.h"
//#include "Poco/Data/LOB.h"

namespace model {
	namespace table {
		enum UserFields
		{
			USER_FIELDS_ID,
			USER_FIELD_EMAIL,
			USER_FIELDS_FIRST_NAME,
			USER_FIELDS_LAST_NAME,
			USER_FIELDS_PASSWORD,
			USER_FIELDS_PUBLIC_KEY,
			USER_FIELDS_PRIVATE_KEY,
			USER_FIELDS_EMAIL_CHECKED,
			USER_FIELDS_LANGUAGE
		};

		

		class User : public ModelBase 
		{
		public:
			User();
			User(const std::string& email, const std::string& first_name, const std::string& last_name, Poco::UInt64 passwordHashed = 0, std::string languageKey = "de");
			~User();

			// generic db operations
			const char* getTableName() { return "users"; }
			std::string toString();
			

			// default getter unlocked
			inline const std::string& getEmail() const { return mEmail; }
			inline const std::string& getFirstName() const { return mFirstName; }
			inline const std::string& getLastName() const { return mLastName; }
			inline const Poco::UInt64& getPasswordHashed() const { return mPasswordHashed; }
			inline const unsigned char* getPublicKey() const { if (mPublicKey.isNull()) return nullptr; return mPublicKey.value().content().data(); }
			inline bool existPrivateKeyCrypted() const { return !mPrivateKey.isNull(); }
			inline const std::vector<unsigned char>& getPrivateKeyCrypted() const { return mPrivateKey.value().content(); }
			inline bool isEmailChecked() const { return mEmailChecked; }
			inline const std::string& getLanguageKey() const { return mLanguageKey; }

			// default setter unlocked
			inline void setEmail(const std::string& email) { mEmail = email; }
			inline void setFirstName(const std::string& first_name) { mFirstName = first_name; }
			inline void setLastName(const std::string& last_name) { mLastName = last_name; }
			inline void setPasswordHashed(const Poco::UInt64& passwordHashed) { mPasswordHashed = passwordHashed; }
			void setPublicKey(const unsigned char* publicKey);
			// copy data, didn't move memory bin
			void setPrivateKey(const MemoryBin* privateKey);
			inline void setEmailChecked(bool emailChecked) { mEmailChecked = emailChecked; }
			inline void setLanguageKey(const std::string& languageKey) { mLanguageKey = languageKey; }

			

		protected:

			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			// insert only with email, first_name, last_name, password if exist and language
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);
			
			std::string mEmail;
			std::string mFirstName;
			std::string mLastName;

			Poco::UInt64 mPasswordHashed;

			Poco::Nullable<Poco::Data::BLOB> mPublicKey;
			Poco::Nullable<Poco::Data::BLOB> mPrivateKey;
			// created: Mysql DateTime

			bool mEmailChecked;
			std::string mLanguageKey;

		};
	}
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_INCLUDE