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

#include "../tasks/HederaTask.h"

namespace controller {
	class HederaTopic : public TableControllerBase, public NotificationList
	{
	public:

		~HederaTopic();

		static Poco::AutoPtr<HederaTopic> create(const std::string& name, int autoRenewAccountId, int autoRenewPeriod, int groupId);
		static std::vector<Poco::AutoPtr<HederaTopic>> listAll();
		static Poco::AutoPtr<HederaTopic> load(int id);
		
		
		bool updateWithGetTopicInfos(Poco::AutoPtr<User> user);


		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }
		Poco::AutoPtr<HederaId> getTopicHederaId();
		Poco::AutoPtr<HederaAccount> getAutoRenewAccount();

		//! \brief hedera call to create a hedera topic
		Poco::AutoPtr<HederaTask> createTopic(Poco::AutoPtr<controller::HederaAccount> operatorAccount, Poco::AutoPtr<controller::User> user);
		
		inline Poco::AutoPtr<model::table::HederaTopic> getModel() { return _getModel<model::table::HederaTopic>(); }


	protected:
		HederaTopic(model::table::HederaTopic* dbModel);
		Poco::AutoPtr<HederaId> mTopicHederaId;
		Poco::AutoPtr<HederaAccount> mAutoRenewAccount;

	};
}

#endif //__GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_TOPIC_H
