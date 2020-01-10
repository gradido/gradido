#ifndef __JSON_INTERFACE_JSON_GET_RUNNING_USER_TASKS_
#define __JSON_INTERFACE_JSON_GET_RUNNING_USER_TASKS_

#include "JsonRequestHandler.h"

class JsonGetRunningUserTasks : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:


};

#endif // __JSON_INTERFACE_JSON_GET_RUNNING_USER_TASKS_