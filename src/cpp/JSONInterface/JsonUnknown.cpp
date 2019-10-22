#include "JsonUnknown.h"

Poco::JSON::Object JsonUnknown::handle(Poco::Dynamic::Var params)
{
	Poco::JSON::Object result;

	result.set("state", "error");
	result.set("msg", "unknown call");

	return result;
}