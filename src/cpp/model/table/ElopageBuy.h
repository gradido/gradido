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
		enum ElopageBuyId {
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
			~ElopageBuy();

			// generic db operations
			const char* getTableName() { return "elopage_buys"; }
			Poco::Data::Statement insertIntoDB(Poco::Data::Session session);
			Poco::Data::Statement updateIntoDB(Poco::Data::Session session);
			Poco::Data::Statement loadFromDB(Poco::Data::Session session, std::string& fieldName);



		protected:
			Poco::Int32 mIDs[ELOPAGE_BUY_MAX];
			std::string mPayerEmail;
			std::string mPublisherEmail;
			bool mPayed;
			Poco::DateTime mSuccessDate;
			std::string mEvent;
		};
	}
}



#endif //GRADIDO_LOGIN_SERVER_MODEL_ELOPAGE_BUY_INCLUDE