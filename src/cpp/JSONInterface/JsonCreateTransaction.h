#ifndef __JSON_INTERFACE_JSON_CREATE_TRANSACTION_
#define __JSON_INTERFACE_JSON_CREATE_TRANSACTION_

#include "JsonRequestHandler.h"
#include "../SingletonManager/SessionManager.h"
#include "../controller/Group.h"

class JsonCreateTransaction : public JsonRequestHandler
{
public:
	JsonCreateTransaction() : mSession(nullptr) {}
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
};

#endif // __JSON_INTERFACE_JSON_CREATE_TRANSACTION_