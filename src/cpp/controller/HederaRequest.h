#ifndef __GRADIDO_LOGIN_SERVER_LIB_HEDERA_REQUEST_
#define __GRADIDO_LOGIN_SERVER_LIB_HEDERA_REQUEST_
/*!
*
* \author: Dario Rekowski
*
* \date: 31.08.2020
*
* \brief: Class for Hedera Requests
*
*/

#include "../controller/NodeServer.h"
#include "../model/hedera/Query.h"
#include "../model/hedera/TransactionGetReceiptQuery.h"
#include "../model/hedera/Transaction.h"
#include "../model/hedera/Response.h"
#include "../model/hedera/TransactionResponse.h"
#include "../tasks/HederaTask.h"

enum HederaRequestReturn
{
	HEDERA_REQUEST_RETURN_OK,
	HEDERA_REQUEST_RETURN_PARSE_ERROR,
	HEDERA_REQUEST_PRECHECK_ERROR,
	HEDERA_REQUEST_RETURN_ERROR,
	HEDERA_REQUEST_UNKNOWN_TRANSACTION,
	HEDERA_REQUEST_UNKNOWN_QUERY,
	HEDERA_REQUEST_CONNECT_ERROR
};

// NodeServerConnection
class HederaRequest : public NotificationList
{
public:
	HederaRequest();
	~HederaRequest();

	HederaRequestReturn request(model::hedera::Query* query, model::hedera::Response* response, Poco::UInt64 fee = 0);
	HederaRequestReturn request(model::hedera::TransactionGetReceiptQuery* query, model::hedera::Response* response);
	HederaRequestReturn request(model::hedera::Transaction* transaction, model::hedera::Response* response);
	//! 
	//! \param task goes into HederaTaskManager and will be run after transaction 
	HederaRequestReturn request(model::hedera::Transaction* transaction, HederaTask* task);
	//! for testing, didn't work server say invalid json :/
	HederaRequestReturn requestViaPHPRelay(model::hedera::Query* query);

protected:

};


#endif //__GRADIDO_LOGIN_SERVER_LIB_HEDERA_REQUEST_
//