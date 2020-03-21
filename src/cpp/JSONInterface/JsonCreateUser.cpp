#include "JsonCreateUser.h"
#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/ErrorManager.h"

#include "../lib/DataTypeConverter.h"

Poco::JSON::Object* JsonCreateUser::handle(Poco::Dynamic::Var params)
{

	int session_id = 0;
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "debugging");
	result->set("msg", "empty implementation");
	return result;
	
}