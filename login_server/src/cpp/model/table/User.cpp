#include "User.h"

#include "Poco/DateTimeFormatter.h"
#include "Poco/Data/Binding.h"

#include "sodium.h"

#include "../../SingletonManager/MemoryManager.h"

#include "../../controller/Group.h"

using namespace Poco::Data::Keywords;
using namespace rapidjson;

namespace model {
	namespace table {

		User::User()
			: mPasswordHashed(0), mEmailChecked(false), mLanguageKey("de"), mDisabled(false), mRole(ROLE_NOT_LOADED)
		{
		}

		User::User(const std::string& email, const std::string& first_name, const std::string& last_name, int group_id, Poco::UInt64 passwordHashed/* = 0*/, std::string languageKey/* = "de"*/)
			: mFirstName(first_name), mLastName(last_name), mPasswordHashed(passwordHashed), mEmailChecked(false), mLanguageKey(languageKey), mDisabled(false), mGroupId(group_id), mRole(ROLE_NOT_LOADED)
		{
			setEmail(email);

		}
		//id, first_name, last_name, email, pubkey, created, email_checked
		User::User(UserTuple tuple)
			: ModelBase(tuple.get<0>()), 
			mFirstName(tuple.get<1>()), mLastName(tuple.get<2>()), mEmail(tuple.get<3>()), mUsername(tuple.get<4>()),
			mDescription(tuple.get<5>()), 
			mPublicKey(tuple.get<6>()), mCreated(tuple.get<7>()), mEmailChecked(tuple.get<8>()), mDisabled(tuple.get<9>()), mGroupId(tuple.get<10>()),
			  mPasswordHashed(0), mLanguageKey("de"), mRole(ROLE_NOT_LOADED)
		{

		}

		User::~User()
		{

		}

		void User::setPrivateKey(const MemoryBin* privateKey)
		{
			std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
			if (!privateKey) {
				mPrivateKey = Poco::Nullable<Poco::Data::BLOB>();
			}
			else {
				mPrivateKey = Poco::Nullable<Poco::Data::BLOB>(Poco::Data::BLOB(*privateKey, privateKey->size()));
			}
			
		}

		void User::setPublicKey(const unsigned char* publicKey)
		{
			std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
			if (!publicKey) {
				mPublicKey = Poco::Nullable<Poco::Data::BLOB>();
			}
			else {
				mPublicKey = Poco::Nullable<Poco::Data::BLOB>(Poco::Data::BLOB(publicKey, 32));
			}
		}

		void User::setEmail(const std::string& email) 
		{
			std::unique_lock<std::shared_mutex> _lock(mSharedMutex); 
			mEmail = email;

			unsigned char email_hash[crypto_generichash_BYTES];

			crypto_generichash(email_hash, crypto_generichash_BYTES,
				(const unsigned char*)email.data(), email.size(),
				NULL, 0);
			mEmailHash = Poco::Nullable<Poco::Data::BLOB>(Poco::Data::BLOB(email_hash, crypto_generichash_BYTES));
		}

		Poco::Data::Statement User::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);

		
			if (mPasswordHashed) {
				insert << "INSERT INTO users (email, first_name, last_name, username, description, password, email_hash, language, group_id) VALUES(?,?,?,?,?,?,?,?,?);",
					use(mEmail), use(mFirstName), use(mLastName), use(mUsername), use(mDescription), bind(mPasswordHashed), use(mEmailHash), use(mLanguageKey), use(mGroupId);
			}
			else {
				insert << "INSERT INTO users (email, first_name, last_name, username, description, email_hash, language, group_id) VALUES(?,?,?,?,?,?,?,?);",
					use(mEmail), use(mFirstName), use(mLastName), use(mUsername), use(mDescription), use(mEmailHash), use(mLanguageKey), use(mGroupId);
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
			select << "SELECT " << getTableName() << ".id, email, first_name, last_name, username, description, password, pubkey, privkey, email_hash, created, email_checked, language, disabled, group_id, user_roles.role_id " 
				   << " FROM " << getTableName() 
				   << " LEFT JOIN user_roles ON " << getTableName() << ".id = user_roles.user_id "
				   << " WHERE " << _fieldName << " = ?" ,
				into(mID), into(mEmail), into(mFirstName), into(mLastName), into(mUsername), into(mDescription), into(mPasswordHashed),
				into(mPublicKey), into(mPrivateKey), into(mEmailHash), into(mCreated), into(mEmailChecked), 
				into(mLanguageKey), into(mDisabled), into(mGroupId), into(mRole);


			return select;
		}

		Poco::Data::Statement User::_loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);
			// 		typedef Poco::Tuple<std::string, std::string, std::string, Poco::Nullable<Poco::Data::BLOB>, int> UserTuple;
			select << "SELECT id, first_name, last_name, email, username, description, pubkey, created, email_checked, disabled, group_id FROM " << getTableName()
				<< " where " << fieldName << " LIKE ?";


			return select;
		}

		Poco::Data::Statement User::_loadMultipleFromDB(Poco::Data::Session session, const std::vector<std::string> fieldNames, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			Poco::Data::Statement select(session);

			if (fieldNames.size() <= 1) {
				throw Poco::NullValueException("User::_loadMultipleFromDB fieldNames empty or contain only one field");
			}

			// 		typedef Poco::Tuple<std::string, std::string, std::string, Poco::Nullable<Poco::Data::BLOB>, int> UserTuple;
			select << "SELECT id, first_name, last_name, email, username, description, pubkey, created, email_checked, disabled, group_id FROM " << getTableName()
				<< " where " << fieldNames[0] << " LIKE ?";
			if (conditionType == MYSQL_CONDITION_AND) {
				for (int i = 1; i < fieldNames.size(); i++) {
					select << " AND " << fieldNames[i] << " LIKE ? ";
				}
			}
			else if (conditionType == MYSQL_CONDITION_OR) {
				for (int i = 1; i < fieldNames.size(); i++) {
					select << " OR " << fieldNames[i] << " LIKE ? ";
				}
			}
			else {
				addError(new ParamError("User::_loadMultipleFromDB", "condition type not implemented", conditionType));
			}

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

		size_t User::updatePrivkey() 
		{ 
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			if (mPrivateKey.isNull() || !mPrivateKey.value().size()) {
				return 0;
			}
			auto result = updateIntoDB("privkey", mPrivateKey.value()); 
			return result; 
		}
		size_t User::updatePublickey()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			if (mPublicKey.isNull() || !mPublicKey.value().size()) {
				return 0;
			}
			auto result = updateIntoDB("pubkey", mPublicKey.value());
			return result;
		}

		size_t User::updatePrivkeyAndPasswordHash()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			if (mPrivateKey.isNull() || !mPasswordHashed || !mID) {
				return 0;
			}
			auto cm = ConnectionManager::getInstance();
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

			Poco::Data::Statement update(session);

			update << "UPDATE users SET password = ?, privkey = ? where id = ?;",
				bind(mPasswordHashed), use(mPrivateKey), use(mID);
			

			size_t resultCount = 0;
			try {
				return update.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "[updatePrivkeyAndPasswordHash] mysql error by update", ex.displayText().data()));
				addError(new ParamError(getTableName(), "data set: \n", toString().data()));
			}
			//printf("data valid: %s\n", toString().data());
			return 0;
		}

		size_t User::updatePubkeyAndPrivkey()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			if (mPrivateKey.isNull() || mPublicKey.isNull() || !mID) {
				return 0;
			}
			auto cm = ConnectionManager::getInstance();
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

			Poco::Data::Statement update(session);

			update << "UPDATE users SET pubkey = ?, privkey = ? where id = ?;",
				use(mPublicKey), use(mPrivateKey), use(mID);


			size_t resultCount = 0;
			try {
				return update.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "[updatePubkeyAndPrivkey] mysql error by update", ex.displayText().data()));
				addError(new ParamError(getTableName(), "data set: \n", toString().data()));
			}
			//printf("data valid: %s\n", toString().data());
			return 0;
		}

		size_t User::updateFieldsFromCommunityServer()
		{
			//! \brief update first_name, last_name, disabled and language
			assert(mID > 0);
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			auto cm = ConnectionManager::getInstance();
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

			Poco::Data::Statement update(session);
			update << "UPDATE users SET first_name = ?, last_name = ?, username = ?, description = ?, disabled = ?, language = ? where id = ?;",
				use(mFirstName), use(mLastName), use(mUsername), use(mDescription), use(mDisabled), use(mLanguageKey), use(mID);

			
			try {
				return update.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "[updateFieldsFromCommunityServer] mysql error by update", ex.displayText().data()));
				addError(new ParamError(getTableName(), "data set: \n", toString().data()));
			}
			return 0;
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
			auto email_hash = mm->getFreeMemory(crypto_generichash_BYTES+1);
			//char pubkeyHex[65], privkeyHex[161];
			
			//memset(pubkeyHex, 0, 65);
			//memset(privkeyHex, 0, 161);
			memset(*pubkeyHex, 0, 65);
			memset(*privkeyHex, 0, 161);
			memset(*email_hash, 0, crypto_generichash_BYTES + 1);

			std::stringstream ss;

			if (!mPublicKey.isNull()) {
				sodium_bin2hex(*pubkeyHex, 65, mPublicKey.value().content().data(), mPublicKey.value().content().size());
			}
			if (!mPrivateKey.isNull()) {
				sodium_bin2hex(*privkeyHex, 161, mPrivateKey.value().content().data(), mPrivateKey.value().content().size());
			}
			if (!mEmailHash.isNull()) {
				sodium_bin2hex(*email_hash, crypto_generichash_BYTES + 1, mEmailHash.value().content().data(), mEmailHash.value().content().size());
			}

			ss << mUsername << std::endl;
			ss << mFirstName << " " << mLastName << " <" << mEmail << ">" << std::endl;
			ss << "username: " << mUsername << std::endl;
			ss << "details: " << mDescription << std::endl;
			ss << "password hash: " << mPasswordHashed << std::endl;
			ss << "public key: " << (char*)*pubkeyHex << std::endl;
			ss << "private key: " << (char*)*privkeyHex << std::endl;
			ss << "email hash: " << (char*)*email_hash << std::endl;
			ss << "created: " << Poco::DateTimeFormatter::format(mCreated, "%f.%m.%Y %H:%M:%S") << std::endl;
			ss << "email checked: " << mEmailChecked << std::endl;
			ss << "language key: " << mLanguageKey << std::endl;
			ss << "disabled: " << mDisabled << std::endl;
			ss << "group id: " << std::to_string(mGroupId) << std::endl;

			mm->releaseMemory(pubkeyHex);
			mm->releaseMemory(privkeyHex);
			mm->releaseMemory(email_hash);

			return ss.str();
		}

		std::string User::toHTMLString()
		{
			auto mm = MemoryManager::getInstance();
			auto pubkeyHex = mm->getFreeMemory(65);
			auto email_hash = mm->getFreeMemory(crypto_generichash_BYTES + 1);

			memset(*pubkeyHex, 0, 65);
			memset(*email_hash, 0, crypto_generichash_BYTES + 1);

			std::stringstream ss;

			if (!mPublicKey.isNull()) {
				sodium_bin2hex(*pubkeyHex, 65, mPublicKey.value().content().data(), mPublicKey.value().content().size());
			}

			if (!mEmailHash.isNull()) {
				sodium_bin2hex(*email_hash, crypto_generichash_BYTES + 1, mEmailHash.value().content().data(), mEmailHash.value().content().size());
			}
			
			ss << "<b>" << mUsername << "</b><br>";
			ss << "<b>" << mFirstName << " " << mLastName << " <" << mEmail << "></b>" << "<br>";
			ss << "username: " << mUsername << "<br>";
			ss << "details: " << mDescription << "<br>";
			ss << "public key: " << (char*)*pubkeyHex << "<br>";
			ss << "email hash: " << (char*)*email_hash << "<br>";
			ss << "created: " << Poco::DateTimeFormatter::format(mCreated, "%f.%m.%Y %H:%M:%S") << "<br>";
			ss << "email checked: " << mEmailChecked << "<br>";
			ss << "language key: " << mLanguageKey << "<br>";
			ss << "role: " << UserRole::typeToString(getRole()) << "<br>";
			ss << "disabled: " << mDisabled << "<br>";
			ss << "group_id: " << std::to_string(mGroupId) << std::endl;

			mm->releaseMemory(pubkeyHex);
			mm->releaseMemory(email_hash);
			
			return ss.str();
		}

		std::string User::getPublicKeyHex() const
		{
			std::shared_lock<std::shared_mutex> _lock(mSharedMutex);
			auto mm = MemoryManager::getInstance();
			auto pubkeyHex = mm->getFreeMemory(65);

			memset(*pubkeyHex, 0, 65);

			if (!mPublicKey.isNull()) {
				sodium_bin2hex(*pubkeyHex, 65, mPublicKey.value().content().data(), mPublicKey.value().content().size());
			}
			std::string pubkeyHexString((const char*)pubkeyHex->data(), pubkeyHex->size()-1);
			mm->releaseMemory(pubkeyHex);
			return pubkeyHexString;
		}

		MemoryBin* User::getPublicKeyCopy() const
		{
			SHARED_LOCK;
			auto mm = MemoryManager::getInstance();
			auto public_key_size = getPublicKeySize();
			if (!public_key_size) return nullptr;
			auto pubkey = mm->getFreeMemory(getPublicKeySize());
			memcpy(*pubkey, getPublicKey(), public_key_size);
			return pubkey;
		}

		std::string User::getPrivateKeyEncryptedHex() const
		{
			std::shared_lock<std::shared_mutex> _lock(mSharedMutex);
			auto mm = MemoryManager::getInstance();
			std::string privkeyHexString;

			if (!mPrivateKey.isNull()) {
				auto priv_key_size = mPrivateKey.value().content().size();
				auto privkeyHex = mm->getFreeMemory(priv_key_size+1);

				memset(*privkeyHex, 0, priv_key_size+1);
				sodium_bin2hex(*privkeyHex, 65, mPrivateKey.value().content().data(), priv_key_size);
				privkeyHexString = std::string((const char*)privkeyHex->data(), privkeyHex->size() - 1);
				mm->releaseMemory(privkeyHex);
			}
			
			return privkeyHexString;
		}

		Value User::getJson(Document::AllocatorType& alloc)
		{
			lock("User::getJson rapid");
			Value userObj; userObj.SetObject();

			userObj.AddMember("first_name", Value(mFirstName.data(), alloc), alloc);
			userObj.AddMember("last_name", Value(mLastName.data(), alloc), alloc);
			userObj.AddMember("email", Value(mEmail.data(), alloc), alloc);
			userObj.AddMember("username", Value(mUsername.data(), alloc), alloc);
			userObj.AddMember("description", Value(mDescription.data(), alloc), alloc);

			//userObj.set("state", userStateToString(mState));
			auto createTimeStamp = mCreated.timestamp();
			userObj.AddMember("created", createTimeStamp.raw() / createTimeStamp.resolution(), alloc);
			userObj.AddMember("email_checked", mEmailChecked, alloc);
			userObj.AddMember("ident_hash", DRMakeStringHash(mEmail.data(), mEmail.size()), alloc);
			userObj.AddMember("language", Value(mLanguageKey.data(), alloc), alloc);
			userObj.AddMember("disabled", mDisabled, alloc);
			try {
				std::string role_name = UserRole::typeToString(getRole());
				userObj.AddMember("role", Value(role_name.data(), alloc), alloc);
			}
			catch (Poco::Exception ex) {
				addError(new ParamError("User::getJson", "exception by getting role", ex.displayText().data()));
				sendErrorsAsEmail();
			}
			auto group = controller::Group::load(mGroupId);
			if (!group.isNull()) {
				userObj.AddMember("group_alias", Value(group->getModel()->getAlias().data(), alloc), alloc);
			}
			unlock();

			return userObj;
		}

		
	}
}