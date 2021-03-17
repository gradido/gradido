#ifndef __GRADIDO_LOGIN_SERVER_VERIFICATION_EMAIL_RESEND_TIMER_TASK__H
#define __GRADIDO_LOGIN_SERVER_VERIFICATION_EMAIL_RESEND_TIMER_TASK__H

#include "CPUTask.h"
#include "Poco/Util/TimerTask.h"

class VerificationEmailResendTask : public UniLib::controller::CPUTask
{
public: 
	VerificationEmailResendTask(int userId);
	~VerificationEmailResendTask();


	const char* getResourceType() const { return "VerificationEmailResendTask"; };

	//! from Poco::Util::TimerTask, called from timer if the time is there
	//! load user from db, check if account is activated if not, send the email verification code a second time
	int run();

protected:
	int mUserId;

};

class VerificationEmailResendTimerTask : public Poco::Util::TimerTask
{
public:
	VerificationEmailResendTimerTask(int userId);
	~VerificationEmailResendTimerTask();

	void run();

protected:
	int mUserId;
};

#endif //__GRADIDO_LOGIN_SERVER_VERIFICATION_EMAIL_RESEND_TIMER_TASK__H
