/*!
*
* \author: einhornimmond
*
* \date: 02.01.19
*
* \brief: manage emails, send all emails with only one connection to mail server, on after on
*/

#ifndef GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_EMAIL_MANAGER_H
#define GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_EMAIL_MANAGER_H

#include "Poco/AutoPtr.h"
#include "Poco/Util/LayeredConfiguration.h"

#include "../lib/MultithreadQueue.h"
#include "../tasks/Thread.h"
#include "../model/email/Email.h"

// MAGIC NUMBER: sleep time if email sending failed (ssl connection was discarded from mailserver)
// wait 5 minute for the next try
#define MAGIC_NUMBER_EMAIL_SEND_RETRY_TIME_MINUTES 5
// MAGIC NUMBER: Retry count if email sending failed
#define MAGIC_NUMBER_MAX_EMAIL_RESEND_COUNT 3

class EmailManager : public UniLib::lib::Thread
{
	
public:
	~EmailManager();

	static EmailManager* getInstance();

	bool init(const Poco::Util::LayeredConfiguration& cfg);

	inline const std::string& getAdminReceiver() { return mEmailAccount.admin_receiver; }

	//! \brief call delete on email after sending it
	void addEmail(model::Email* email);
	
protected:
	EmailManager();
	void exit();

	int ThreadFunction();

	bool connectToEmailServer(Poco::Net::SecureSMTPClientSession& mailClientSession, NotificationList& errorList);

	struct EmailAccount {
		std::string sender;
		std::string admin_receiver;
		std::string username;
		std::string password;
		std::string url;
		int port;
	};
	Poco::Logger& mEmailLog;
	EmailAccount mEmailAccount;

	bool mInitalized;
	bool mDisableEmail;

	UniLib::lib::MultithreadQueue<model::Email*> mPendingEmails;

};



#endif //GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_EMAIL_MANAGER_H