#include "Session.h"
#include "Poco/RegularExpression.h"
#include "../SingletonManager/SessionManager.h"

Session::Session(int handle)
	: mHandleId(handle)
{

}

Session::~Session()
{


}


void Session::reset()
{

}

bool Session::createUser(const std::string& name, const std::string& email, const std::string& password, const std::string& passphrase)
{
	auto sm = SessionManager::getInstance();
	if (!sm->isValid(name, VALIDATE_NAME)) {
		addError(new Error("Vorname", "Bitte gebe einen Namen an. Mindestens 3 Zeichen, keine Sonderzeichen oder Zahlen."));
		return false;
	}
	if (!sm->isValid(email, VALIDATE_EMAIL)) {
		addError(new Error("E-Mail", "Bitte gebe eine g&uuml;ltige E-Mail Adresse an."));
		return false;
	}
	if (!sm->isValid(password, VALIDATE_PASSWORD)) {
		addError(new Error("Password", "Bitte gebe ein g&uuml;ltiges Password ein mit mindestens 8 Zeichen, Gro&szlig;- und Kleinbuchstaben, mindestens einer Zahl und einem Sonderzeichen"));
		return false;
	}
	if (passphrase.size() > 0 && !sm->isValid(passphrase, VALIDATE_PASSPHRASE)) {
		addError(new Error("Merksatz", "Der Merksatz ist nicht g&uuml;ltig, er besteht aus 24 W&ouml;rtern, mit Komma getrennt."));
		return false;
	}
	mSessionUser = new User(email.data(), name.data(), password.data(), passphrase.size() ? passphrase.data() : nullptr);
	return true;
}

bool Session::loadUser(const std::string& email, const std::string& password)
{
	return true;
}