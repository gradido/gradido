#include "TestRegExp.h"

#include "Poco/RegularExpression.h"
#include "Poco/Exception.h"

// Poco::RegularExpression PageRequestMessagedHandler::mDetectLanguageGET("^(?:/[a-zA-Z0-9_-]*)?(?:/(en|de)|\?.*lang=(en|de))");

TestRegExp::TestRegExp()
{

}

TestRegExp::~TestRegExp()
{

}
//! \return 0 if init okay, else return != 0
int TestRegExp::init()
{
	try {
		Poco::RegularExpression detectLanguageGet("^(?:/[a-zA-Z0-9_-]*)?(?:/(en|de)|\\?.*lang=(en|de))");
		std::vector<std::string> matches;
		detectLanguageGet.split("/resetPassword?lang=en&email=", matches);
		int zahl = 0;
	}
	catch (Poco::RegularExpressionException& ex) {
		printf("regular expression exception: %s\n", ex.displayText().data());
		return -1;
	}

	return 0;
}

//! \return 0 if okay, else return != 0
int TestRegExp::test()
{
	return 0;
}