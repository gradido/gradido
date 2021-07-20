#ifndef __JSON_INTERFACE_JSON_GET_RUNNING_USER_TASKS_
#define __JSON_INTERFACE_JSON_GET_RUNNING_USER_TASKS_

#include "JsonRequestHandler.h"

class JsonGetRunningUserTasks : public JsonRequestHandler
{
public:
	rapidjson::Document handle(const rapidjson::Document& params); 

protected:


};

#endif // __JSON_INTERFACE_JSON_GET_RUNNING_USER_TASKS_