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

enum HederaRequestReturn
{
	HEDERA_REQUEST_RETURN_OK,
	HEDERA_REQUEST_RETURN_PARSE_ERROR,
	HEDERA_REQUEST_RETURN_ERROR,
	HEDERA_REQUEST_CONNECT_ERROR
};

// NodeServerConnection
class HederaRequest : public ErrorList
{
public:
	HederaRequest();
	~HederaRequest();

	HederaRequestReturn request(model::hedera::Query* query);

protected:

};


#endif //__GRADIDO_LOGIN_SERVER_LIB_HEDERA_REQUEST_
//