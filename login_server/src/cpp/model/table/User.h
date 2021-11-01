#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_INCLUDE

#include "ModelBase.h"
#include "../../SingletonManager/MemoryManager.h"

#include "Poco/Tuple.h"
#include "Poco/DateTime.h"
//#include "Poco/Nullable.h"
//#include "Poco/Data/LOB.h"


#include "UserRole.h"

namespace model {
	namespace table {
		enum UserFields
		{
			USER_FIELDS_ID,
			USER_FIELD_EMAIL,
			USER_FIELDS_FIRST_NAME,
			USER_FIELDS_LAST_NAME,
			USER_FIELDS_USERNAME,
			USER_FIELDS_DESCRIPTION,
			USER_FIELDS_PASSWORD,
			USER_FIELDS_PUBLIC_KEY,
			USER_FIELDS_PRIVATE_KEY,
			USER_FIELDS_CREATED,
			USER_FIELDS_EMAIL_CHECKED,
			USER_FIELDS_LANGUAGE
		};

		typedef Poco::Tuple<
					int, // id 
					std::string, // first name
					std::string, // last name
					std::string, // email 
					std::string, // username
					std::string, // description
					Poco::Nullable<Poco::Data::BLOB>, // public key
					Poco::DateTime, // created
					int, // check email
					int, // disabled
					int, // group_id
					int  // publisher_id
		> UserTuple;

		class User : public ModelBase 
		{
		public:
			User();
			User(UserTuple tuple);
			User(const std::string& email, const std::string& first_name, const std::string& last_name, int group_id, Poco::UInt64 passwordHashed = 0, std::string languageKey = "de");
			

			// generic db operations
			const char* getTableName() const { return "users"; }
			std::string toString();
			std::string toHTMLString();

			// specific db operation
			size_t updatePrivkey();
			size_t updatePublickey();
			size_t updatePrivkeyAndPasswordHash();
			size_t updatePubkeyAndPrivkey();
			
			//! \brief update first_name, last_name, disabled and language
			size_t updateFieldsFromCommunityServer();

			// default getter unlocked
			inline const std::string getEmail() const { SHARED_LOCK; return mEmail; }
			inline const std::string getFirstName() const { SHARED_LOCK; return mFirstName; }
			inline const std::string getLastName() const { SHARED_LOCK; return mLastName; }
			inline const std::string getUsername() const { SHARED_LOCK; return mUsername; }
			inline const std::string getDescription() const { SHARED_LOCK; return mDescription; }
			inline std::string getNameWithEmailHtml() const { SHARED_LOCK; return mFirstName + "&nbsp;" + mLastName + "&nbsp;&lt;" + mEmail + "&gt;"; }
			inline const Poco::UInt64 getPasswordHashed() const { SHARED_LOCK; return mPasswordHashed; }
			inline int getGroupId() const { SHARED_LOCK; return mGroupId; }
			inline int getPublisherId() const { SHARED_LOCK; return mPublisherId; }
			inline RoleType getRole() const { SHARED_LOCK; if (mRole.isNull()) return ROLE_NONE; return static_cast<RoleType>(mRole.value()); }
			inline const unsigned char* getPublicKey() const { SHARED_LOCK; if (mPublicKey.isNull()) return nullptr; return mPublicKey.value().content().data(); }
			MemoryBin* getPublicKeyCopy() const;
			inline size_t getPublicKeySize() const { SHARED_LOCK; if (mPublicKey.isNull()) return 0; return mPublicKey.value().content().size(); }
			std::string getPublicKeyHex() const;
			std::string getPrivateKeyEncryptedHex() const;

			inline bool hasPrivateKeyEncrypted() const { SHARED_LOCK; return !mPrivateKey.isNull(); }
			inline bool hasPublicKey() const { SHARED_LOCK; return !mPublicKey.isNull(); }
			inline bool hasEmailHash() const { SHARED_LOCK; return !mEmailHash.isNull(); }
			inline const std::vector<unsigned char>& getPrivateKeyEncrypted() const { SHARED_LOCK; return mPrivateKey.value().content(); }
			inline bool isEmailChecked() const { SHARED_LOCK; return mEmailChecked; }
			inline const std::string getLanguageKey() const { SHARED_LOCK; return mLanguageKey; }
			inline bool isDisabled() const { SHARED_LOCK; return mDisabled; }

			// default setter unlocked
			void setEmail(const std::string& email);
			inline void setFirstName(const std::string& first_name) { UNIQUE_LOCK; mFirstName = first_name; }
			inline void setLastName(const std::string& last_name) { UNIQUE_LOCK; mLastName = last_name; }
			inline void setUsername(const std::string& username) { UNIQUE_LOCK; mUsername = username; }
			inline void setDescription(const std::string& description) { UNIQUE_LOCK; mDescription = description; }
			inline void setPasswordHashed(const Poco::UInt64& passwordHashed) { UNIQUE_LOCK; mPasswordHashed = passwordHashed; }
			void setPublicKey(const unsigned char* publicKey);
			//! \brief set encrypted private key
			//! \param privateKey copy data, didn't move memory bin
			void setPrivateKey(const MemoryBin* privateKey);
			inline void setEmailChecked(bool emailChecked) { UNIQUE_LOCK; mEmailChecked = emailChecked; }
			inline void setLanguageKey(const std::string& languageKey) { UNIQUE_LOCK; mLanguageKey = languageKey; }
			inline void setDisabled(bool disabled) { UNIQUE_LOCK; mDisabled = disabled; }
			inline void setGroupId(int groupId) { UNIQUE_LOCK; mGroupId = groupId; }
			inline void setPublisherId(int publisherId) { UNIQUE_LOCK; mPublisherId = publisherId; }

			rapidjson::Value getJson(rapidjson::Document::AllocatorType& alloc);
			static MemoryBin* createEmailHash(const std::string& email);

		protected:
			~User();

			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::vector<std::string> fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			// insert only with email, first_name, last_name, password if exist and language
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);
			
			std::string mEmail;
			std::string mFirstName;
			std::string mLastName;
			std::string mUsername;
			std::string mDescription;
			Poco::UInt64 mPasswordHashed;

			Poco::Nullable<Poco::Data::BLOB> mPublicKey;
			Poco::Nullable<Poco::Data::BLOB> mPrivateKey;
			Poco::Nullable<Poco::Data::BLOB> mEmailHash; // sodium generic hash (currently blake2b)
			// created: Mysql DateTime
			Poco::DateTime mCreated;

			bool mEmailChecked;
			std::string mLanguageKey;
			//! if account should delete but cannot because public keys for transaction needed, until gradido node is running
			//! if set to true, prevent login
			bool mDisabled;

			int mGroupId;
			int mPublisherId;

			// from neighbor tables
			Poco::Nullable<int> mRole;

			
		};
	}
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_INCLUDE