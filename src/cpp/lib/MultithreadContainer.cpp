#include "MultithreadContainer.h"
#include "ErrorList.h"

namespace UniLib {
	namespace lib {

		void MultithreadContainer::lock(const char* stackDetails/* = nullptr*/)
		{
			try {
				mWorkMutex.lock(500);
			}
			catch (Poco::TimeoutException& ex) {
				ErrorList errors;
				if (stackDetails) {
					errors.addError(new Error("MultithreadContainer::lock", stackDetails));
				}
				errors.addError(new ParamError("MultithreadContainer::lock", "lock timeout", ex.displayText()));
				errors.sendErrorsAsEmail();
			}
		}
	}
}