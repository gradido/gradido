#include "EmailCustomReply.h"

#include "../../SingletonManager/EmailManager.h"
#include "Poco/Net/MediaType.h"

namespace model {
	using namespace Poco;

	EmailCustomReply::EmailCustomReply(AutoPtr<controller::User> user, const std::string& replyString, EmailType type)
		: Email(user, type), mReplyStr(replyString)
	{

	}

	bool EmailCustomReply::addReplyStr(Net::MailMessage* mailMessage)
	{
		return false;
	}

}