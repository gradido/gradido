#ifndef __JSON_INTERFACE_JSON_CREATE_TRANSACTION_
#define __JSON_INTERFACE_JSON_CREATE_TRANSACTION_

#include "JsonRequestHandler.h"
#include "SingletonManager/SessionManager.h"
#include "controller/Group.h"
#include "model/gradido/TransactionBody.h"

class JsonCreateTransaction : public JsonRequestHandler
{
public:
	JsonCreateTransaction() : mAutoSign(false), mBlockchainType(model::gradido::BLOCKCHAIN_MYSQL) {}
	rapidjson::Document handle(const rapidjson::Document& params);
	
protected:
	rapidjson::Document transfer(const rapidjson::Document& params);
	rapidjson::Document creation(const rapidjson::Document& params);
	rapidjson::Document groupMemberUpdate(const rapidjson::Document& params);
	MemoryBin* getTargetPubkey(const rapidjson::Document& params);
	
	std::string mMemo;
	
	Poco::AutoPtr<controller::User> mReceiverUser;
	model::gradido::BlockchainType mBlockchainType;
	//! if set to true, transaction will be direct signed by user which belong to session
	bool mAutoSign;

};

#endif // __JSON_INTERFACE_JSON_CREATE_TRANSACTION_