#include "UserBackups.h"
#include "../../controller/User.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {

		UserBackups::UserBackups()
			: mUserId(0), mMnemonicType(0)
		{
			detectMnemonic();
		}

		UserBackups::UserBackups(int user_id, const std::string& passphrase, ServerConfig::Mnemonic_Types type)
			: mUserId(user_id), mPassphrase(passphrase), mMnemonicType(type)
		{
			detectMnemonic();
		}


		UserBackups::UserBackups(const UserBackupsTuple& tuple)
			: ModelBase(tuple.get<0>()), mUserId(tuple.get<1>()), mPassphrase(tuple.get<2>()), mMnemonicType(tuple.get<3>())
		{
			detectMnemonic();
		}

		UserBackups::~UserBackups()
		{

		}

		Poco::Data::Statement UserBackups::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);

			lock();
			insert << "INSERT INTO " << getTableName()
				<< " (user_id, passphrase, mnemonic_type) VALUES(?,?,?)"
				, use(mUserId), bind(mPassphrase), use(mMnemonicType);
			unlock();
			return insert;
		}


		Poco::Data::Statement UserBackups::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, passphrase, mnemonic_type FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mUserId), into(mPassphrase), into(mMnemonicType);


			return select;
		}

		Poco::Data::Statement UserBackups::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id FROM " << getTableName()
				<< " where user_id = ?"
				, into(mID), use(mUserId);

			return select;
		}

		Poco::Data::Statement UserBackups::_loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, passphrase, mnemonic_type FROM " << getTableName()
				<< " where " << fieldName << " = ?";


			return select;
		}

		Poco::Data::Statement UserBackups::_loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			Poco::Data::Statement select(session);
			if (fieldNames.size() <= 1) {
				throw Poco::NullValueException("UserRoles::_loadFromDB fieldNames empty or contain only one field");
			}

			select << "SELECT id, user_id, passphrase, mnemonic_type FROM " << getTableName()
				<< " where " << fieldNames[0] << " = ? ";
			if (conditionType == MYSQL_CONDITION_AND) {
				for (int i = 1; i < fieldNames.size(); i++) {
					select << " AND " << fieldNames[i] << " = ? ";
				}
			}
			else if (conditionType == MYSQL_CONDITION_OR) {
				for (int i = 1; i < fieldNames.size(); i++) {
					select << " OR " << fieldNames[i] << " = ? ";
				}
			}
			else {
				addError(new ParamError("UserBackups::_loadFromDB", "condition type not implemented", conditionType));
			}
			//<< " where " << fieldName << " = ?"
			select, into(mID), into(mUserId), into(mPassphrase), into(mMnemonicType);


			return select;
		}

		// generic db operations
		std::string UserBackups::toString()
		{
			std::stringstream ss;
			ss << "user_id: " << mUserId << std::endl;
			ss << "passphrase: " << mPassphrase << std::endl;
			ss << "mnemonic type: " << mMnemonicType << std::endl;
			return ss.str();
		}

		void UserBackups::detectMnemonic()
		{
			if (mMnemonicType == -1) {
				const static char* function_name = "UserBackups::detectMnemonic";
				auto user = controller::User::create();
				if (1 == user->load(mUserId)) {
					auto user_model = user->getModel();
					KeyPairEd25519 user_key(user_model->getPublicKey());
					auto mnemonic = Passphrase::detectMnemonic(mPassphrase, &user_key);

					for (int i = 0; i < ServerConfig::MNEMONIC_MAX; i++) {
						if (&ServerConfig::g_Mnemonic_WordLists[i] == mnemonic) {
							mMnemonicType = i;
							updateIntoDB("mnemonic_type", mMnemonicType);
							break;
						}
					}
				}
				else {
					addError(new ParamError(function_name, "error loading user for user_backup", mUserId));
				}
			}

		}
	}
}