#include "JsonUnknown.h"

Poco::JSON::Object* JsonUnknown::handle(Poco::Dynamic::Var params)
{
	Poco::JSON::Object* result = new Poco::JSON::Object;

	result->set("state", "error");
	result->set("msg", "unknown call");

	return result;
}