#include "EmailOptIn.h"

#include "sodium.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		EmailOptIn::EmailOptIn(const Poco::UInt64& code, int user_id)
			: mUserId(user_id), mEmailVerificationCode(code)
		{
			
		}

		EmailOptIn::EmailOptIn()
			: mUserId(0), mEmailVerificationCode(0)
		{

		}

		EmailOptIn::~EmailOptIn()
		{

		}


		Poco::Data::Statement EmailOptIn::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);

			lock();
			insert << "INSERT INTO " << getTableName()
				<< " (user_id, verification_code) VALUES(?,?)"
				, bind(mUserId), bind(mEmailVerificationCode);
			unlock();
			return insert;
		}


		Poco::Data::Statement EmailOptIn::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT user_id, verification_code FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mUserId), into(mEmailVerificationCode);

			return select;
		}
	}
}


