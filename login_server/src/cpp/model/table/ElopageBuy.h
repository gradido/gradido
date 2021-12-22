#ifndef GRADIDO_LOGIN_SERVER_MODEL_ELOPAGE_BUY_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_ELOPAGE_BUY_INCLUDE

/*!
 * @author: Dario Rekowski
 *
 * @date: 31.10.2019
 *
 * @brief: Model for handling Elopage publisher 
 * 
 */

#include "ModelBase.h"
#include "Poco/Types.h"
#include "Poco/Net/NameValueCollection.h"

namespace model {
	namespace table {
		enum ElopageBuyIDFields {
			ELOPAGE_BUY_ID,
			ELOPAGE_BUY_AFFILIATE_PROGRAM_ID,
			ELOPAGE_BUY_PUBLISHER_ID,
			ELOPAGE_BUY_ORDER_ID,
			ELOPAGE_BUY_PRODUCT_ID,
			ELOPAGE_BUY_PRODUCT_PRICE,

			ELOPAGE_BUY_MAX
		};

		class ElopageBuy : public ModelBase
		{
		public:
			ElopageBuy(const Poco::Net::NameValueCollection& elopage_webhook_requestData);
			ElopageBuy();
			
			// generic db operations
			const char* getTableName() const { return "login_elopage_buys"; }
			
			std::string toString();
			
		protected:
			~ElopageBuy();

			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			Poco::Int32 mIDs[ELOPAGE_BUY_MAX];
			std::string mPayerEmail;
			std::string mPublisherEmail;
			bool mPayed;
			Poco::DateTime mSuccessDate;
			std::string mEvent;
		};


		// check for user existing
		class UserHasElopageTask : public UniLib::controller::CPUTask
		{
		public:
			UserHasElopageTask(std::string email) : mEmail(email), mHasElopage(false) {}

			int run();
			const char* getResourceType() const { return "UserHasElopageTask"; };
			bool hasElopage() const { return mHasElopage; }

		protected:
			std::string mEmail;
			bool mHasElopage;
		};
	}
}



#endif //GRADIDO_LOGIN_SERVER_MODEL_ELOPAGE_BUY_INCLUDE