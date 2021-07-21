#include "JsonLogout.h"

#include "../SingletonManager/SessionManager.h"

using namespace rapidjson;

Document JsonLogout::handle(const Document& params)
{
	auto paramError = rcheckAndLoadSession(params);
	if (paramError.IsObject()) return paramError;

	auto sm = SessionManager::getInstance();
	if (sm->releaseSession(mSession->getHandle())) {
		mSession = nullptr;
		return rstateSuccess();
	}
	return rstateError("error by releasing session");
}
