#ifndef GRADIDO_BLOCKCHAIN_CONNECTOR_JSON_INTERFACE_JSON_PACK_TRANSACTION_H
#define GRADIDO_BLOCKCHAIN_CONNECTOR_JSON_INTERFACE_JSON_PACK_TRANSACTION_H

#include "JsonRequestHandler.h"

/*!
* @author Dario Rekowski
* @date 2021-12-13
* @brief create protobuf byte array from transaction details*
*/

class JsonPackTransaction : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:
	typedef std::pair<Poco::AutoPtr<model::gradido::Transaction>, std::string> TransactionGroupAlias;

	Poco::JSON::Object* transfer(Poco::Dynamic::Var params);
	Poco::JSON::Object* creation(Poco::Dynamic::Var params);
	Poco::JSON::Object* groupMemberUpdate(Poco::Dynamic::Var params);

	Poco::JSON::Object* resultBase64Transactions(std::vector<TransactionGroupAlias> transactions);

	std::string mMemo;
	Poco::DateTime mCreated;
};


#endif //GRADIDO_BLOCKCHAIN_CONNECTOR_JSON_INTERFACE_JSON_PACK_TRANSACTION_H