#ifndef __JSON_INTERFACE_JSON_TRANSACTION_
#define __JSON_INTERFACE_JSON_TRANSACTION_

#include "JsonRequestHandler.h"

class Session;

class JsonTransaction : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:
	bool startProcessingTransaction(Session* session, const std::string& transactionBase64);


};

#endif // __JSON_INTERFACE_JSON_TRANSACTION_