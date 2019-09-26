#include "ErrorList.h"

ErrorList::ErrorList()
{

}

ErrorList::~ErrorList()
{
	while (mErrorStack.size() > 0) {
		delete mErrorStack.top();
		mErrorStack.pop();
	}
}

void ErrorList::addError(Error* error)
{
	mErrorStack.push(error);
}

Error* ErrorList::getLastError()
{
	if (mErrorStack.size() == 0) {
		return nullptr;
	}

	Error* error = mErrorStack.top();
	if (error) {
		mErrorStack.pop();
	}

	return error;
}

void ErrorList::clearErrors()
{
	while (mErrorStack.size()) {
		auto error = mErrorStack.top();
		if (error) {
			delete error;
		}
		mErrorStack.pop();
	}
}


int ErrorList::getErrors(ErrorList* send)
{
	Error* error = nullptr;
	int iCount = 0;
	while (error = send->getLastError()) {
		addError(error);
		iCount++;
	}
	return iCount;
}

void ErrorList::printErrors()
{
	while (mErrorStack.size() > 0) {
		auto error = mErrorStack.top();
		mErrorStack.pop();
		printf(error->getString().data());
		delete error;
	}
}