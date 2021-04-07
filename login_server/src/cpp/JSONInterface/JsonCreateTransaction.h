#ifndef __JSON_INTERFACE_JSON_CREATE_TRANSACTION_
#define __JSON_INTERFACE_JSON_CREATE_TRANSACTION_

#include "JsonRequestHandler.h"
#include "../SingletonManager/SessionManager.h"
#include "../controller/Group.h"
#include "../model/gradido/TransactionBody.h"

class JsonCreateTransaction : public JsonRequestHandler
{
public:
	JsonCreateTransaction() : mSession(nullptr), mAutoSign(false) {}
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);
	
protected:
	Poco::JSON::Object* transfer(Poco::Dynamic::Var params);
	Poco::JSON::Object* creation(Poco::Dynamic::Var params);
	Poco::JSON::Object* groupMemberUpdate(Poco::Dynamic::Var params);
	MemoryBin* getTargetPubkey(Poco::Dynamic::Var params);
	bool getTargetGroup(Poco::Dynamic::Var params);

	Session* mSession;
	std::string mMemo;
	Poco::AutoPtr<controller::Group> mTargetGroup;
	Poco::AutoPtr<controller::User> mReceiverUser;
	model::gradido::BlockchainType mBlockchainType;
	//! if set to true, transaction will be direct signed by user which belong to session
	bool mAutoSign;

};

#endif // __JSON_INTERFACE_JSON_CREATE_TRANSACTION_