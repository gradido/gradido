#include "MultithreadContainer.h"
#include "ErrorList.h"

namespace UniLib {
	namespace lib {

		void MultithreadContainer::lock(const char* stackDetails/* = nullptr*/)
		{
			const static char* functionName = "MultithreadContainer::lock";
			try {
				mWorkMutex.lock(500);
				if (stackDetails) {
					mLastSucceededLock = stackDetails;
				}
			}
			catch (Poco::TimeoutException& ex) {
				ErrorList errors;
				errors.addError(new ParamError(functionName, "lock timeout", ex.displayText()));
				if (mLastSucceededLock != "") {
					errors.addError(new ParamError(functionName, "last succeed lock by ", mLastSucceededLock.data()));
				}
				if (stackDetails) {
					errors.addError(new Error(functionName, stackDetails));
				}
				
				errors.sendErrorsAsEmail();
			}
		}
	}
}