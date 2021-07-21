#ifndef __JSON_INTERFACE_JSON_SEARCH_
#define __JSON_INTERFACE_JSON_SEARCH_

#include "JsonRequestHandler.h"

/*!
* @author Dario Rekowski
* @date 2020-09-28
* @brief search for public informations (no session_id needed), like account id for email hash
*
* 
*/

class JsonSearch : public JsonRequestHandler
{
public:
	rapidjson::Document handle(const rapidjson::Document& params);

protected:


};

#endif // __JSON_INTERFACE_JSON_SEARCH_