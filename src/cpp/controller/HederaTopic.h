#ifndef __GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_TOPIC_H
#define __GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_TOPIC_H

/*!
*
* \author: Dario Rekowski
*
* \date: 03.09.2020
*
* \brief: Class for Hedera Topic, connct db table with hedera object
*
*/
#include "TableControllerBase.h"
#include "../model/table/HederaTopic.h"
#include "HederaId.h"
#include "HederaAccount.h"


namespace controller {
	class HederaTopic : public TableControllerBase, public NotificationList
	{
	public:

		~HederaTopic();

		static Poco::AutoPtr<HederaTopic> create(const std::string& name, int autoRenewAccountId, int autoRenewPeriod, int groupId);
		static std::vector<Poco::AutoPtr<HederaTopic>> listAll();
		static Poco::AutoPtr<HederaTopic> load(int id);
		//! \brief hedera call to create a hedera topic
		Poco::UInt64 hederaCreateTopic();
		bool updateWithGetTopicInfos(Poco::AutoPtr<User> user);

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }
		Poco::AutoPtr<HederaId> getTopicHederaId();
		Poco::AutoPtr<HederaAccount> getAutoRenewAccount();

		

		inline Poco::AutoPtr<model::table::HederaTopic> getModel() { return _getModel<model::table::HederaTopic>(); }


	protected:
		HederaTopic(model::table::HederaTopic* dbModel);
		Poco::AutoPtr<HederaId> mTopicHederaId;
		Poco::AutoPtr<HederaAccount> mAutoRenewAccount;

	};
}

#endif //__GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_TOPIC_H
