/*!
*
* \author: einhornimmond
*
* \date: 04.02.20
*
* \brief: store email with additional reply address
*/

#ifndef GRADIDO_LOGIN_SERVER_MODEL_EMAIL_CUSTOM_REPLY_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_EMAIL_CUSTOM_REPLY_INCLUDE

#include "Email.h"

namespace model {
	using namespace Poco;


	class EmailCustomReply : public Email
	{
	public:
		EmailCustomReply(AutoPtr<controller::User> user, const std::string& replyString, EmailType type);
		

		//bool draft(Net::MailMessage* mailMessage, LanguageCatalog* langCatalog);
		bool addReplyStr(Net::MailMessage* mailMessage);

	protected:
		std::string mReplyStr;
	};
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_EMAIL_INCLUDE