#include "ElopageBuy.h"
#include "Poco/DateTimeFormatter.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		const static std::string g_requestFieldsNames[] = {
			"product[affiliate_program_id]", "publisher[id]", "order_id", "product_id",
			"product[price]", "payer[email]", "publisher[email]", "payment_state", "success_date", "event" };

		ElopageBuy::ElopageBuy(const Poco::Net::NameValueCollection& elopage_webhook_requestData)
			: mPayed(false)
		{
			memset(mIDs, 0, ELOPAGE_BUY_MAX * sizeof(Poco::Int32));
			for (int i = 0; i < 5; i++) {
				std::string temp = elopage_webhook_requestData.get(g_requestFieldsNames[i], "0");
				//printf("get: %s for field: %s (%d)\n", temp.data(), g_requestFieldsNames[i].data(), i);
				try {
					if (i == 4) {
						mIDs[i + 1] = static_cast<Poco::Int32>(round(stof(temp) * 100.0f));
					}
					else {
						mIDs[i + 1] = stoul(temp);
					}
				}
				catch (const std::invalid_argument& ia) { addError(new ParamError("ElopageBuy", "parse string to number, invalid argument", ia.what())); }
				catch (const std::out_of_range& oor) { addError(new ParamError("ElopageBuy", "parse string to number, Out of Range error", oor.what())); }
				catch (const std::logic_error & ler) { addError(new ParamError("ElopageBuy", "parse string to number, Logical error", ler.what())); }
				catch (...) { addError(new Error("ElopageBuy", "parse string to number, unknown error")); }
			}
			mPayerEmail = elopage_webhook_requestData.get(g_requestFieldsNames[5], "");
			mPublisherEmail = elopage_webhook_requestData.get(g_requestFieldsNames[6], "");
			std::string payed = elopage_webhook_requestData.get(g_requestFieldsNames[7], "");
			// payment_state = paid
			if (payed == "paid") mPayed = true;

			mSuccessDate = parseElopageDate(elopage_webhook_requestData.get(g_requestFieldsNames[8], ""));
			mEvent = elopage_webhook_requestData.get(g_requestFieldsNames[9], "");
		}

		ElopageBuy::~ElopageBuy()
		{

		}

		/*
		ELOPAGE_BUY_AFFILIATE_PROGRAM_ID,
		ELOPAGE_BUY_PUBLISHER_ID,
		ELOPAGE_BUY_ORDER_ID,
		ELOPAGE_BUY_PRODUCT_ID,
		ELOPAGE_BUY_PRODUCT_PRICE
		*/

		Poco::Data::Statement ElopageBuy::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);

			lock();
			insert << "INSERT INTO " << getTableName()
				<< " (affiliate_program_id, publisher_id, order_id, product_id, product_price, payer_email, publisher_email, payed, success_date, event) "
				<< " VALUES(?,?,?,?,?,?,?,?,?,?)"
				, bind(mIDs[ELOPAGE_BUY_AFFILIATE_PROGRAM_ID]), bind(mIDs[ELOPAGE_BUY_PUBLISHER_ID])
				, bind(mIDs[ELOPAGE_BUY_ORDER_ID]), bind(mIDs[ELOPAGE_BUY_PRODUCT_ID]), bind(mIDs[ELOPAGE_BUY_PRODUCT_PRICE])
				, bind(mPayerEmail), bind(mPublisherEmail), bind(mPayed), bind(mSuccessDate), bind(mEvent);
			unlock();
			return insert;

		}

		std::string ElopageBuy::toString()
		{
			std::stringstream ss;
			ss << "affiliate program id: " << mIDs[ELOPAGE_BUY_AFFILIATE_PROGRAM_ID] << std::endl;
			ss << "publisher id: " << mIDs[ELOPAGE_BUY_PUBLISHER_ID] << std::endl;
			ss << "order id: " << mIDs[ELOPAGE_BUY_ORDER_ID] << std::endl;
			ss << "product id: " << mIDs[ELOPAGE_BUY_PRODUCT_ID] << std::endl;
			ss << "product price: " << mIDs[ELOPAGE_BUY_PRODUCT_PRICE] << std::endl;
			ss << "payer email: " << mPayerEmail << std::endl;
			ss << "publisher email: " << mPublisherEmail << std::endl;
			ss << "payed: " << mPayed << std::endl;
			ss << "success date: " << Poco::DateTimeFormatter::format(mSuccessDate, "%d.%m.%Y %H:%M:%S") << std::endl;
			ss << "event: " << mEvent << std::endl;
			return ss.str();
		}
		
		Poco::Data::Statement ElopageBuy::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			//	Poco::Data::Statement select(session);

			throw Poco::Exception("ElopageBuy::loadFromDB not implemented");

		}

		Poco::Data::Statement ElopageBuy::_loadIdFromDB(Poco::Data::Session session) 
		{

			Poco::Data::Statement select(session);

			select << "SELECT id FROM " << getTableName()
				<< " where order_id = ?"
				, into(mID), use(mIDs[ELOPAGE_BUY_ORDER_ID]);

			return select;
		}
	}
}

