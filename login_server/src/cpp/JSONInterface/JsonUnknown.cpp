#include "JsonUnknown.h"

using namespace rapidjson;

Document JsonUnknown::handle(const Document& params)
{
	return stateError("unknown call");
}
